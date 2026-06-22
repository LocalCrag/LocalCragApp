"""Generic APScheduler setup and shared job infrastructure."""

from __future__ import annotations

import atexit
import datetime
import zlib
from collections.abc import Callable
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.base import BaseTrigger
from apscheduler.triggers.date import DateTrigger
from sqlalchemy import text

from extensions import db

# Keep a module-level reference so we don't start multiple schedulers per process
_scheduler: Optional[BackgroundScheduler] = None


def get_scheduler() -> Optional[BackgroundScheduler]:
    return _scheduler


def run_with_advisory_lock(
    app,
    lock_name: str,
    work: Callable[[], None],
    *,
    skip_message: str,
    start_message: str,
    complete_message: str,
) -> None:
    """Run ``work`` inside an app context, guarded by a Postgres advisory lock."""
    with app.app_context():
        lock_id = zlib.crc32(lock_name.encode("utf-8"))
        got_lock = False
        try:
            try:
                got_lock = db.session.execute(
                    text("SELECT pg_try_advisory_lock(:lock_id)"), {"lock_id": lock_id}
                ).scalar()
            except Exception:
                app.logger.exception("Failed to acquire lock %s", lock_id)
                db.session.rollback()
                got_lock = True

            if not got_lock:
                app.logger.info(skip_message)
                return

            app.logger.info(start_message)
            work()
            app.logger.info(complete_message)
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


def schedule_immediate_job(job_id: str, func: Callable[[], None]) -> bool:
    """Queue a one-shot job to run as soon as possible.

    Multiple requests coalesce into a single pending job. Returns False when the
    background scheduler is not running (caller should run work synchronously).
    """
    if not _scheduler or not _scheduler.running:
        return False

    _scheduler.add_job(
        func=func,
        trigger=DateTrigger(run_date=datetime.datetime.now(datetime.timezone.utc)),
        id=job_id,
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    return True


def reschedule_job_trigger(job_id: str, trigger: BaseTrigger) -> None:
    """Update an existing job's trigger when the scheduler is running."""
    if not _scheduler or not _scheduler.running:
        return
    _scheduler.reschedule_job(job_id, trigger=trigger)


def init_schedulers(app) -> None:
    """Initialize and start background schedulers.

    Safe to call multiple times; it will only start once per process.
    """
    global _scheduler
    if _scheduler and _scheduler.running:
        return

    from scheduler_jobs import register_jobs

    scheduler = BackgroundScheduler(timezone="UTC")
    job_ids = register_jobs(app, scheduler)
    scheduler.start()
    _scheduler = scheduler
    app.logger.info("APScheduler started with jobs: %s", ", ".join(job_ids))

    atexit.register(lambda: _scheduler and _scheduler.shutdown(wait=False))
