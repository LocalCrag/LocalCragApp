"""Scheduled notification digest mailer."""

from __future__ import annotations

import datetime

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
from util.moderator_task_notifications import should_show_notification_to_user
from util.notifications import should_send_notification_mail

JOB_ID = "send_notification_digests_daily"


def register(app, scheduler: BackgroundScheduler) -> str:
    scheduler.add_job(
        func=lambda: _run(app),
        trigger=IntervalTrigger(hours=24),
        id=JOB_ID,
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    return JOB_ID


def send_notification_digests(app, *, respect_digest_schedule: bool = True) -> dict[str, int]:
    """Send pending notification digest emails and mark them as delivered.

    When ``respect_digest_schedule`` is True (scheduler), weekly-digest users are skipped
    on non-Mondays. When False (dev trigger), all pending mail is sent immediately.

    Returns counts of users and notifications included in digest mails.
    """
    with app.app_context():
        notifications = (
            Notification.query.filter(Notification.delivered_at.is_(None), Notification.dismissed_at.is_(None))
            .order_by(Notification.time_created.asc())
            .all()
        )
        if not notifications:
            return {"usersMailed": 0, "notificationsMailed": 0}

        notifications_by_user: dict[str, list[Notification]] = {}
        for notification in notifications:
            notifications_by_user.setdefault(str(notification.user_id), []).append(notification)

        users_mailed = 0
        notifications_mailed = 0
        for user_id, user_notifications in notifications_by_user.items():
            user = User.find_by_id(user_id)
            settings = user.account_settings
            if (
                respect_digest_schedule
                and settings.notification_digest_frequency == NotificationDigestFrequencyEnum.WEEKLY
                and not _is_monday_utc()
            ):
                continue

            mail_notifications = [
                notification
                for notification in user_notifications
                if should_show_notification_to_user(user, notification.type)
                and should_send_notification_mail(settings, notification.type)
            ]
            if not mail_notifications:
                continue

            send_notification_digest_email(user, mail_notifications)
            now_ts = text("CURRENT_TIMESTAMP")
            for notification in mail_notifications:
                db.session.query(Notification).filter(Notification.id == notification.id).update(
                    {"delivered_at": now_ts}, synchronize_session=False
                )
            users_mailed += 1
            notifications_mailed += len(mail_notifications)
        db.session.commit()
        return {"usersMailed": users_mailed, "notificationsMailed": notifications_mailed}


def _run(app) -> None:
    app.logger.info("Starting send_notification_digests job.")
    try:
        counts = send_notification_digests(app)
        app.logger.info(
            "Completed send_notification_digests job: usersMailed=%s notificationsMailed=%s",
            counts["usersMailed"],
            counts["notificationsMailed"],
        )
    except Exception:
        app.logger.exception("send_notification_digests job failed")
        raise


def _is_monday_utc() -> bool:
    return datetime.datetime.now(datetime.timezone.utc).weekday() == 0
