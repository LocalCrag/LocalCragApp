"""Daily cleanup of file rows that nothing references."""

from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from util.instance_timezone import get_instance_timezone_name

DAILY_JOB_ID = "delete_unattached_files_daily"
_LOCK_NAME = "delete_unattached_files_job_lock"


def register(app, scheduler: BackgroundScheduler) -> str:
    scheduler.add_job(
        func=lambda: _run_with_lock(app),
        trigger=_daily_trigger(app),
        id=DAILY_JOB_ID,
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    return DAILY_JOB_ID


def reschedule_unattached_file_cleanup_job(app) -> None:
    """Update the daily cleanup to match the current instance timezone."""
    from schedulers import reschedule_job_trigger

    reschedule_job_trigger(DAILY_JOB_ID, _daily_trigger(app))


def _daily_trigger(app):
    with app.app_context():
        timezone = get_instance_timezone_name()
    # 03:00 local, after the midnight closure materialization.
    return CronTrigger(hour=3, minute=0, timezone=timezone)


def _run_with_lock(app) -> None:
    from schedulers import run_with_advisory_lock
    from util.file_links import delete_unattached_files

    run_with_advisory_lock(
        app,
        _LOCK_NAME,
        delete_unattached_files,
        skip_message="delete_unattached_files skipped: another instance is running.",
        start_message="Starting delete_unattached_files job.",
        complete_message="Completed delete_unattached_files job.",
    )
