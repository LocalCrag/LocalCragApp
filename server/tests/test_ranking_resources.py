import datetime
import time

from models.crag import Crag
from models.instance_settings import InstanceSettings
from models.line import Line
from models.sector import Sector
from util.scripts.build_rankings import build_rankings


def test_successful_get_ranking_boulder(client):
    rv = client.get("/api/ranking?line_type=BOULDER")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 1
    assert res[0]["user"]["slug"] == "admin-admin"
    assert res[0]["top10"] == 22
    assert res[0]["top50"] == 22
    assert res[0]["totalCount"] == 1

    rv = client.get(f'/api/ranking?line_type=BOULDER&sector_id={Sector.get_id_by_slug("schattental")}')
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 1
    assert res[0]["user"]["slug"] == "admin-admin"
    assert res[0]["top10"] == 22
    assert res[0]["top50"] == 22
    assert res[0]["totalCount"] == 1

    rv = client.get(f'/api/ranking?line_type=BOULDER&crag_id={Crag.get_id_by_slug("brione")}')
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 1
    assert res[0]["user"]["slug"] == "admin-admin"
    assert res[0]["top10"] == 22
    assert res[0]["top50"] == 22
    assert res[0]["totalCount"] == 1


def test_successful_get_ranking_invalid_type(client):
    rv = client.get("/api/ranking?line_type=BASKETBALL")
    assert rv.status_code == 400


def test_successful_get_ranking_invalid_crag_and_sector_query_params(client):
    rv = client.get(
        f'/api/ranking?line_type=BOULDER&crag_id={Crag.get_id_by_slug("brione")}'
        f'&sector_id={Sector.get_id_by_slug("schattental")}'
    )
    assert rv.status_code == 400


def test_successful_get_ranking_sport(client):
    rv = client.get("/api/ranking?line_type=SPORT")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 0


def test_successful_update_ranking(client, admin_token):
    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": True,
        "hard": False,
        "withKneepad": True,
        "rating": 2,
        "comment": "Hahahahaha",
        "year": None,
        "gradeValue": 10,
        "line": str(Line.get_id_by_slug("treppe")),
        "date": "2024-04-13",
    }
    rv = client.post("/api/ascents", token=admin_token, json=ascent_data)
    assert rv.status_code == 201

    # Trigger a ranking rebuild
    build_rankings()

    # We don't know when the thread completes from the previous request.
    # So we need to wait for the ranking to be updated.
    # We will wait for a maximum of 5 seconds and check with increasing intervals.
    # If the ranking is not updated by then, we will fail the test.
    max_wait_time = 5
    wait_time = 0.5
    total_wait_time = 0

    while total_wait_time < max_wait_time:
        rv = client.get("/api/ranking?line_type=BOULDER")
        if rv.status_code == 200:
            res = rv.json
            if (
                len(res) == 1
                and res[0]["user"]["slug"] == "admin-admin"
                and res[0]["top10"] == 23
                and res[0]["top50"] == 23
                and res[0]["totalCount"] == 2
            ):
                break
        time.sleep(wait_time)
        total_wait_time += wait_time
        wait_time *= 2
    assert rv.status_code == 200
    assert len(res) == 1
    assert res[0]["user"]["slug"] == "admin-admin"
    assert res[0]["top10"] == 23
    assert res[0]["top50"] == 23
    assert res[0]["totalCount"] == 2


def test_ranking_respects_past_weeks_setting(client, admin_token):
    # Set ranking to consider only past 1 week
    instance_settings = InstanceSettings.return_it()
    instance_settings.ranking_past_weeks = 1
    from extensions import db

    db.session.add(instance_settings)
    db.session.commit()

    # Trigger a ranking rebuild; since seed ascents are old, rankings should be empty now
    build_rankings()

    max_wait_time = 5
    wait_time = 0.5
    total_wait_time = 0
    while total_wait_time < max_wait_time:
        rv = client.get("/api/ranking?line_type=BOULDER")
        if rv.status_code == 200 and rv.json == []:
            break
        time.sleep(wait_time)
        total_wait_time += wait_time
        wait_time *= 2
    assert rv.status_code == 200
    assert rv.json == []

    # Create a new ascent with today's date so it falls within the window
    today = datetime.datetime.utcnow().date().strftime("%Y-%m-%d")
    ascent_data = {
        "flash": False,
        "fa": False,
        "soft": False,
        "hard": False,
        "withKneepad": False,
        "rating": 1,
        "comment": "Recent tick",
        "year": None,
        "gradeValue": 10,
        "line": str(Line.get_id_by_slug("treppe")),
        "date": today,
    }
    rv = client.post("/api/ascents", token=admin_token, json=ascent_data)
    assert rv.status_code == 201

    build_rankings()

    max_wait_time = 5
    wait_time = 0.5
    total_wait_time = 0
    res = None
    while total_wait_time < max_wait_time:
        rv = client.get("/api/ranking?line_type=BOULDER")
        if rv.status_code == 200:
            res = rv.json
            if len(res) == 1 and res[0]["totalCount"] == 1:
                break
        time.sleep(wait_time)
        total_wait_time += wait_time
        wait_time *= 2
    assert rv.status_code == 200
    assert len(res) == 1
    assert res[0]["totalCount"] == 1


def test_scheduler_schedules_ranking_every_15_minutes(client):
    """Ensure the build_rankings job is scheduled with a 15-minute interval when the scheduler is initialized."""
    # Import within the test to avoid side-effects on module import
    from apscheduler.triggers.interval import IntervalTrigger

    import schedulers as sched
    from app import app as flask_app
    from schedulers import init_schedulers

    # Ensure a clean scheduler state
    if getattr(sched, "_scheduler", None) and sched._scheduler.running:
        sched._scheduler.shutdown(wait=False)
        sched._scheduler = None

    init_schedulers(flask_app)

    assert sched._scheduler is not None and sched._scheduler.running

    job = sched._scheduler.get_job("build_rankings_every_15m")
    assert job is not None, "Ranking job should be registered"
    assert isinstance(job.trigger, IntervalTrigger), "Ranking job should use an interval trigger"
    assert job.trigger.interval.total_seconds() == 15 * 60, "Ranking job should run every 15 minutes"

    # Teardown: stop scheduler to avoid cross-test side effects
    sched._scheduler.shutdown(wait=False)
    sched._scheduler = None
