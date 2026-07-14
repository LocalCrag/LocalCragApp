"""Register all background scheduler jobs."""

from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler


def register_jobs(app, scheduler: BackgroundScheduler) -> list[str]:
    from scheduler_jobs import (
        build_rankings,
        closure_materialization,
        notification_digests,
    )

    return [
        build_rankings.register(app, scheduler),
        notification_digests.register(app, scheduler),
        closure_materialization.register(app, scheduler),
    ]
