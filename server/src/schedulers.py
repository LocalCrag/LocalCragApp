from __future__ import annotations

import atexit
import datetime
import zlib
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import text

from extensions import db
from models.enums.notification_digest_frequency_enum import (
    NotificationDigestFrequencyEnum,
)
from models.notification import Notification
from models.user import User
from util.email import send_notification_digest_email
from util.notifications import should_send_notification_mail

# Keep a module-level reference so we don't start multiple schedulers per process
_scheduler: Optional[BackgroundScheduler] = None


def _run_build_rankings_with_lock(app):
    """
    Run build_rankings inside an application context and guard execution with a
    Postgres advisory lock so that, even if multiple processes schedule the job,
    only one actually performs the work at a time.
    """
    from util.build_rankings import build_rankings

    with app.app_context():
        # Use a stable lock ID for the build_rankings job
        lock_name = "build_rankings_job_lock"
        lock_id = zlib.crc32(lock_name.encode("utf-8"))
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
    scheduler.add_job(
        func=lambda: _run_send_notification_digests(app),
        trigger=IntervalTrigger(hours=24),
        id="send_notification_digests_daily",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )

    scheduler.start()
    _scheduler = scheduler

    # Ensure graceful shutdown on process exit
    atexit.register(lambda: _scheduler and _scheduler.shutdown(wait=False))


def _run_send_notification_digests(app):
    with app.app_context():
        notifications = (
            Notification.query.filter(Notification.delivered_at.is_(None), Notification.dismissed_at.is_(None))
            .order_by(Notification.time_created.asc())
            .all()
        )
        if not notifications:
            return

        notifications_by_user: dict[str, list[Notification]] = {}
        for notification in notifications:
            notifications_by_user.setdefault(str(notification.user_id), []).append(notification)

        for user_id, user_notifications in notifications_by_user.items():
            user = User.find_by_id(user_id)
            settings = user.account_settings
            frequency = settings.notification_digest_frequency
            if frequency == NotificationDigestFrequencyEnum.WEEKLY and not _is_monday_utc():
                continue

            mail_notifications = [
                notification
                for notification in user_notifications
                if should_send_notification_mail(settings, notification.type)
            ]
            if not mail_notifications:
                continue

            send_notification_digest_email(user, mail_notifications)
            now_ts = text("CURRENT_TIMESTAMP")
            for notification in mail_notifications:
                db.session.query(Notification).filter(Notification.id == notification.id).update(
                    {"delivered_at": now_ts}, synchronize_session=False
                )
        db.session.commit()


def _is_monday_utc() -> bool:
    # Monday is weekday 0 in Python's datetime API.
    return datetime.datetime.now(datetime.timezone.utc).weekday() == 0
