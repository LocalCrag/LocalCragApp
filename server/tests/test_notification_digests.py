from unittest.mock import MagicMock, patch

from apscheduler.triggers.interval import IntervalTrigger


def test_scheduler_schedules_notification_digests_daily(client):
    """Digest job is registered with a 24-hour interval when the scheduler starts."""
    import schedulers as sched
    from app import app as flask_app
    from schedulers import init_schedulers

    if getattr(sched, "_scheduler", None) and sched._scheduler.running:
        sched._scheduler.shutdown(wait=False)
        sched._scheduler = None

    init_schedulers(flask_app)

    assert sched._scheduler is not None and sched._scheduler.running

    job = sched._scheduler.get_job("send_notification_digests_daily")
    assert job is not None, "Notification digest job should be registered"
    assert isinstance(job.trigger, IntervalTrigger)
    assert job.trigger.interval.total_seconds() == 24 * 60 * 60

    sched._scheduler.shutdown(wait=False)
    sched._scheduler = None


def test_digest_job_skips_when_advisory_lock_held(client):
    """Second worker must not send digests while another instance holds the lock."""
    from app import app as flask_app
    from scheduler_jobs import notification_digests

    lock_result = MagicMock()
    lock_result.scalar.return_value = False

    with patch("scheduler_jobs.notification_digests.send_notification_digests") as mock_send:
        with patch("schedulers.db.session.execute", return_value=lock_result):
            notification_digests._run_with_lock(flask_app)

    mock_send.assert_not_called()


def test_digest_job_sends_when_advisory_lock_acquired(client):
    """Owning worker sends digests after acquiring the advisory lock."""
    from app import app as flask_app
    from scheduler_jobs import notification_digests

    lock_result = MagicMock()
    lock_result.scalar.return_value = True

    with patch(
        "scheduler_jobs.notification_digests.send_notification_digests",
        return_value={"usersMailed": 0, "notificationsMailed": 0},
    ) as mock_send:
        with patch("schedulers.db.session.execute", return_value=lock_result):
            with patch("schedulers.db.session.commit"):
                notification_digests._run_with_lock(flask_app)

    mock_send.assert_called_once_with(flask_app)
