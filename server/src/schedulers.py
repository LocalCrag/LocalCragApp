from __future__ import annotations

import atexit
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import text

from extensions import db

# Keep a module-level reference so we don't start multiple schedulers per process
_scheduler: Optional[BackgroundScheduler] = None


def _run_build_rankings_with_lock(app):
    """
    Run build_rankings inside an application context and guard execution with a
    Postgres advisory lock so that, even if multiple processes schedule the job,
    only one actually performs the work at a time.
    """
    from util.scripts.build_rankings import build_rankings

    with app.app_context():
        # Use a stable bigint lock ID for the build_rankings job
        lock_id = "build_rankings_job_lock"
        lock_id = abs(hash(lock_id)) % (2**31)  # Ensure it's a positive 32-bit integer
        got_lock = False
        try:
            try:
                got_lock = db.session.execute(
                    text("SELECT pg_try_advisory_lock(:lock_id)"), {"lock_id": lock_id}
                ).scalar()
            except Exception:
                # If DB doesn't support advisory locks, just proceed best-effort but log the issue
                app.logger.exception("Failed to acquire lock %s", lock_id)
                db.session.rollback()
                got_lock = True

            if not got_lock:
                app.logger.info("build_rankings skipped: another instance is running.")
                return

            app.logger.info("Starting build_rankings job.")
            build_rankings()
            app.logger.info("Completed build_rankings job.")
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        finally:
            if got_lock:
                try:
                    db.session.execute(text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": lock_id})
                    db.session.commit()
                except Exception:
                    db.session.rollback()


def init_schedulers(app) -> None:
    """
    Initialize and start background schedulers.
    Safe to call multiple times; it will only start once per process.
    """

    global _scheduler
    if _scheduler and _scheduler.running:
        return

    scheduler = BackgroundScheduler(timezone="UTC")

    scheduler.add_job(
        func=lambda: _run_build_rankings_with_lock(app),
        trigger=IntervalTrigger(minutes=15),
        id="build_rankings_every_15m",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )

    scheduler.start()
    _scheduler = scheduler

    # Ensure graceful shutdown on process exit
    atexit.register(lambda: _scheduler and _scheduler.shutdown(wait=False))
