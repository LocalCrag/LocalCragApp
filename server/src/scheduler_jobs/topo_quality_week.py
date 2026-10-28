"""Refresh the open week's quality snapshot and send the finished week's summary.

Runs every day at 03:20 in the instance timezone. The summary mail is still
once per finished week. Each run only looks at the immediately previous week,
so a later morning in that same week retries when Monday was missed or the
moderator game was off. The daily snapshot keeps the open week current on
the trends chart.
"""

from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from util.instance_timezone import get_instance_timezone_name

DAILY_JOB_ID = "topo_quality_week_daily"
_LOCK_NAME = "topo_quality_week_job_lock"


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


def reschedule_topo_quality_week_job(app) -> None:
    from schedulers import reschedule_job_trigger

    reschedule_job_trigger(DAILY_JOB_ID, _daily_trigger(app))


def _daily_trigger(app):
    with app.app_context():
        timezone = get_instance_timezone_name()
    # Every day at 03:20 local, so a missed Monday summary is retried later that week.
    return CronTrigger(hour=3, minute=20, timezone=timezone)


def _run_with_lock(app) -> None:
    from schedulers import run_with_advisory_lock

    def _run():
        from util.topo_quality_history import run_weekly_maintenance

        run_weekly_maintenance()

    run_with_advisory_lock(
        app,
        _LOCK_NAME,
        _run,
        skip_message="topo_quality_week skipped: another instance is running.",
        start_message="Starting topo_quality_week job.",
        complete_message="Completed topo_quality_week job.",
    )
