"""Scheduled build_rankings job."""

from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

JOB_ID = "build_rankings_every_15m"
_LOCK_NAME = "build_rankings_job_lock"


def register(app, scheduler: BackgroundScheduler) -> str:
    scheduler.add_job(
        func=lambda: _run_with_lock(app),
        trigger=IntervalTrigger(minutes=15),
        id=JOB_ID,
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    return JOB_ID


def _run_with_lock(app) -> None:
    from schedulers import run_with_advisory_lock
    from util.build_rankings import build_rankings

    def work() -> None:
        build_rankings()
        from extensions import db

        db.session.commit()

    run_with_advisory_lock(
        app,
        _LOCK_NAME,
        work,
        skip_message="build_rankings skipped: another instance is running.",
        start_message="Starting build_rankings job.",
        complete_message="Completed build_rankings job.",
    )
