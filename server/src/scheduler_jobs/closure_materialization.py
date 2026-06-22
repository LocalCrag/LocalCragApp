"""Scheduled closure materialization jobs."""

from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from util.instance_timezone import get_instance_timezone_name
from util.scheduled_closure import apply_materialized_closures

DAILY_JOB_ID = "apply_closure_schedules_daily"
IMMEDIATE_JOB_ID = "apply_closure_schedules_immediate"
_LOCK_NAME = "apply_closure_schedules_job_lock"


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


def enqueue_closure_materialization(app) -> bool:
    """Queue a one-shot closure materialization job to run as soon as possible."""
    from schedulers import schedule_immediate_job

    return schedule_immediate_job(
        IMMEDIATE_JOB_ID,
        lambda: _run_with_lock(app),
    )


def reschedule_closure_materialization_job(app) -> None:
    """Update the daily closure job to match the current instance timezone."""
    from schedulers import reschedule_job_trigger

    reschedule_job_trigger(DAILY_JOB_ID, _daily_trigger(app))


def _daily_trigger(app):
    with app.app_context():
        timezone = get_instance_timezone_name()
    return CronTrigger(hour=0, minute=0, timezone=timezone)


def _run_with_lock(app) -> None:
    from schedulers import run_with_advisory_lock

    run_with_advisory_lock(
        app,
        _LOCK_NAME,
        apply_materialized_closures,
        skip_message="apply_closure_schedules skipped: another instance is running.",
        start_message="Starting apply_closure_schedules job.",
        complete_message="Completed apply_closure_schedules job.",
    )
