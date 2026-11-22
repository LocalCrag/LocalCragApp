"""Hourly CondiCaster conditions refresh."""

from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

JOB_ID = "condicaster_refresh_hourly"
_LOCK_NAME = "condicaster_refresh_job_lock"


def register(app, scheduler: BackgroundScheduler) -> str:
    scheduler.add_job(
        func=lambda: _run_with_lock(app),
        trigger=IntervalTrigger(hours=1),
        id=JOB_ID,
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    return JOB_ID


def enqueue(app, crag_id: int) -> bool:
    """Refresh one crag as soon as the scheduler can, without blocking the request."""
    from schedulers import schedule_immediate_job

    return schedule_immediate_job(
        f"condicaster_refresh_{crag_id}",
        lambda: _refresh_one_with_lock(app, crag_id),
    )


def _run_with_lock(app) -> None:
    from schedulers import run_with_advisory_lock
    from util.condicaster import refresh_all

    run_with_advisory_lock(
        app,
        _LOCK_NAME,
        refresh_all,
        skip_message="CondiCaster refresh skipped: another instance is running.",
        start_message="Starting CondiCaster refresh.",
        complete_message="Completed CondiCaster refresh.",
    )


def _refresh_one_with_lock(app, crag_id: int) -> None:
    from schedulers import run_with_advisory_lock
    from util.condicaster import refresh_one

    run_with_advisory_lock(
        app,
        _LOCK_NAME,
        lambda: refresh_one(crag_id),
        skip_message=f"CondiCaster refresh for {crag_id} skipped: another instance is running.",
        start_message=f"Starting CondiCaster refresh for {crag_id}.",
        complete_message=f"Completed CondiCaster refresh for {crag_id}.",
    )
