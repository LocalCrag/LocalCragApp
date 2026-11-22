from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from extensions import db
from models.area import Area
from models.condicaster_cache import CondicasterCache
from models.crag import Crag
from models.instance_settings import InstanceSettings
from models.sector import Sector
from util.condicaster import _in_quiet_hours, refresh_one


def _set_api_key(value="test-key"):
    settings = InstanceSettings.return_it()
    settings.condicaster_api_key = value
    db.session.commit()


def _cache(crag_id, **kwargs):
    existing = db.session.get(CondicasterCache, crag_id)
    if existing is not None:
        db.session.delete(existing)
        db.session.flush()
    db.session.add(CondicasterCache(condicaster_crag_id=crag_id, **kwargs))


def _clear(area, sector, crag):
    area.condicaster_crag_id = None
    sector.condicaster_crag_id = None
    crag.condicaster_crag_id = None
    db.session.add_all([area, sector, crag])
    db.session.commit()


def test_conditions_for_area_prefer_area(client):
    area: Area = Area.find_by_slug("shark-attack")
    sector: Sector = area.sector
    crag: Crag = sector.crag
    area.condicaster_crag_id = 11
    sector.condicaster_crag_id = 22
    crag.condicaster_crag_id = 33
    db.session.add_all([area, sector, crag])
    _cache(
        11,
        timezone="Europe/Zurich",
        current_condiscore=4.2,
        current_valid_at=datetime(2026, 11, 22, 8, tzinfo=timezone.utc).replace(tzinfo=None),
        hourly_json=[{"condiscore": 4.2}],
        daily_json=[{"daytime_condiscore": 3.5}],
    )
    db.session.commit()

    rv = client.get(f"/api/condicaster/conditions/area/{area.slug}")
    assert rv.status_code == 200
    assert rv.json["condicasterCragId"] == 11
    assert rv.json["currentCondiscore"] == 4.2
    assert rv.json["timezone"] == "Europe/Zurich"
    assert rv.json["hourly"][0]["condiscore"] == 4.2


def test_conditions_for_area_fall_back_to_sector(client):
    area: Area = Area.find_by_slug("shark-attack")
    sector: Sector = area.sector
    crag: Crag = sector.crag
    _clear(area, sector, crag)
    sector.condicaster_crag_id = 22
    crag.condicaster_crag_id = 33
    _cache(22, current_condiscore=2.4)
    db.session.commit()

    rv = client.get(f"/api/condicaster/conditions/area/{area.slug}")
    assert rv.status_code == 200
    assert rv.json["condicasterCragId"] == 22
    assert rv.json["currentCondiscore"] == 2.4


def test_conditions_for_area_fall_back_to_crag(client):
    area: Area = Area.find_by_slug("shark-attack")
    sector: Sector = area.sector
    crag: Crag = sector.crag
    _clear(area, sector, crag)
    crag.condicaster_crag_id = 33
    _cache(33, current_condiscore=1.1)
    db.session.commit()

    rv = client.get(f"/api/condicaster/conditions/area/{area.slug}")
    assert rv.status_code == 200
    assert rv.json["condicasterCragId"] == 33
    assert rv.json["currentCondiscore"] == 1.1


def test_conditions_for_sector_prefer_sector(client):
    sector: Sector = Sector.find_by_slug("pampelmousse")
    crag: Crag = sector.crag
    sector.condicaster_crag_id = 44
    crag.condicaster_crag_id = 55
    db.session.commit()

    rv = client.get(f"/api/condicaster/conditions/sector/{sector.slug}")
    assert rv.status_code == 200
    assert rv.json["condicasterCragId"] == 44


def test_conditions_for_sector_fall_back_to_crag(client):
    sector: Sector = Sector.find_by_slug("pampelmousse")
    crag: Crag = sector.crag
    sector.condicaster_crag_id = None
    crag.condicaster_crag_id = 55
    db.session.commit()

    rv = client.get(f"/api/condicaster/conditions/sector/{sector.slug}")
    assert rv.status_code == 200
    assert rv.json["condicasterCragId"] == 55


def test_conditions_for_crag_without_cache(client):
    crag: Crag = Crag.find_by_slug("brione")
    crag.condicaster_crag_id = 66
    db.session.commit()

    rv = client.get(f"/api/condicaster/conditions/crag/{crag.slug}")
    assert rv.status_code == 200
    assert rv.json["condicasterCragId"] == 66
    assert rv.json["currentCondiscore"] is None
    assert rv.json["hourly"] == []


def test_conditions_invalid_level(client):
    rv = client.get("/api/condicaster/conditions/nope/brione")
    assert rv.status_code == 400


def test_refresh_one_stores_today_and_the_next_seven_days(client, monkeypatch):
    crag: Crag = Crag.find_by_slug("brione")
    crag.condicaster_crag_id = 77
    existing = db.session.get(CondicasterCache, 77)
    if existing is not None:
        db.session.delete(existing)
    db.session.commit()
    _set_api_key()
    calls = []

    def fake_request(path: str):
        calls.append(path)
        if path.endswith("/developer/usage"):
            return {"remaining": 400}
        if "resolution=hourly" in path:
            day = path.split("date=")[1].split("&")[0]
            return {
                "crag_id": 77,
                "timezone": "UTC",
                "data": [
                    {
                        "local_date": day,
                        "valid_at": f"{day}T00:00:00Z",
                        "condiscore": 3.6,
                        "temperature_c": 8.0,
                    }
                ],
            }
        if "resolution=daily" in path:
            day = path.split("date=")[1].split("&")[0]
            return {
                "crag_id": 77,
                "timezone": "UTC",
                "data": [{"local_date": day, "daytime_condiscore": 3.2}],
            }
        raise AssertionError(path)

    monkeypatch.setattr("util.condicaster.time.sleep", lambda *_args, **_kwargs: None)
    monkeypatch.setattr("util.condicaster._request", fake_request)
    monkeypatch.setattr("util.condicaster._in_quiet_hours", lambda *_args, **_kwargs: False)
    with client.application.app_context():
        refresh_one(77)

    cache = db.session.get(CondicasterCache, 77)
    today = datetime.now(timezone.utc).date()
    hourly_dates = [hour["local_date"] for hour in cache.hourly_json]
    assert float(cache.current_condiscore) == 3.6
    assert cache.timezone == "UTC"
    assert hourly_dates == [(today + timedelta(days=offset)).isoformat() for offset in range(8)]
    assert cache.forecast_hourly_fetched_at is not None
    assert len(cache.daily_json) == 11
    assert len([path for path in calls if "resolution=hourly" in path]) == 8

    calls.clear()
    with client.application.app_context():
        refresh_one(77)

    cache = db.session.get(CondicasterCache, 77)
    assert [path for path in calls if "resolution=hourly" in path] == [
        f"/api/v1/crags/77/conditions?date={today.isoformat()}&resolution=hourly"
    ]
    assert [hour["local_date"] for hour in cache.hourly_json] == hourly_dates

    cache.forecast_hourly_fetched_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=1)
    db.session.commit()
    calls.clear()
    with client.application.app_context():
        refresh_one(77)

    assert len([path for path in calls if "resolution=hourly" in path]) == 8
    assert not any("resolution=daily" in path for path in calls)


def test_quiet_hours_run_from_23_until_5(monkeypatch):
    def at(hour: int) -> bool:
        moment = datetime(2026, 1, 15, hour, 30, tzinfo=timezone.utc).replace(tzinfo=None)
        monkeypatch.setattr("util.condicaster._utcnow", lambda: moment)
        return _in_quiet_hours("UTC")

    assert at(23) is True
    assert at(0) is True
    assert at(4) is True
    assert at(5) is False
    assert at(22) is False
    assert _in_quiet_hours(None) is False


def test_refresh_skips_hourly_during_quiet_hours(client, monkeypatch):
    crag: Crag = Crag.find_by_slug("brione")
    crag.condicaster_crag_id = 78
    existing = db.session.get(CondicasterCache, 78)
    if existing is not None:
        db.session.delete(existing)
    db.session.commit()
    _set_api_key()
    calls = []

    def fake_request(path: str):
        calls.append(path)
        if path.endswith("/developer/usage"):
            return {"remaining": 400}
        if "resolution=hourly" in path:
            day = path.split("date=")[1].split("&")[0]
            return {
                "crag_id": 78,
                "timezone": "Europe/Berlin",
                "data": [{"local_date": day, "valid_at": f"{day}T12:00:00Z", "condiscore": 2.0}],
            }
        if "resolution=daily" in path:
            day = path.split("date=")[1].split("&")[0]
            return {
                "crag_id": 78,
                "timezone": "Europe/Berlin",
                "data": [{"local_date": day, "daytime_condiscore": 2.0}],
            }
        raise AssertionError(path)

    monkeypatch.setattr("util.condicaster.time.sleep", lambda *_args, **_kwargs: None)
    monkeypatch.setattr("util.condicaster._request", fake_request)
    monkeypatch.setattr("util.condicaster._in_quiet_hours", lambda *_args, **_kwargs: False)
    with client.application.app_context():
        refresh_one(78)

    today = datetime.now(timezone.utc).astimezone(ZoneInfo("Europe/Berlin")).date()
    today_hourly = f"/api/v1/crags/78/conditions?date={today.isoformat()}&resolution=hourly"
    assert today_hourly in calls

    monkeypatch.setattr("util.condicaster._in_quiet_hours", lambda *_args, **_kwargs: True)
    calls.clear()
    with client.application.app_context():
        refresh_one(78)
    assert calls == []

    cache = db.session.get(CondicasterCache, 78)
    stale = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)
    cache.forecast_hourly_fetched_at = stale
    cache.daily_fetched_at = stale
    db.session.commit()
    calls.clear()
    with client.application.app_context():
        refresh_one(78)

    assert today_hourly not in calls
    assert len([path for path in calls if "resolution=hourly" in path]) == 7
    assert len([path for path in calls if "resolution=daily" in path]) == 11


def test_search_locations_by_name(client, moderator_token, monkeypatch):
    from util.condicaster import _search_cache

    _search_cache.clear()
    calls = []

    def fake_public(path: str):
        calls.append(path)
        return [
            {
                "condicaster_id": 1000047626,
                "loc_id": 1000047626,
                "name": "Kottenheimer Winfeld",
                "area": "Koblenz",
                "country": "Germany",
            },
            {"name": "Missing id"},
        ]

    monkeypatch.setattr("util.condicaster._public_json", fake_public)
    first = client.get("/api/condicaster/crags?q=kottenheim", token=moderator_token)
    second = client.get("/api/condicaster/crags?q=Kottenheim", token=moderator_token)

    assert first.status_code == 200
    assert first.json["crags"] == [
        {
            "cragId": 1000047626,
            "name": "Kottenheimer Winfeld",
            "areaName": "Koblenz",
            "countryName": "Germany",
            "distanceKm": None,
        }
    ]
    assert second.json == first.json
    assert calls == ["/locations?q=kottenheim"]

    short = client.get("/api/condicaster/crags?q=k", token=moderator_token)
    assert short.status_code == 400


def test_search_crags_requires_moderator(client):
    rv = client.get("/api/condicaster/crags?lat=46.34&lon=9.34")
    assert rv.status_code == 401


def test_search_crags_rejects_bad_coordinates(client, moderator_token):
    rv = client.get("/api/condicaster/crags?lat=nope&lon=9.34", token=moderator_token)
    assert rv.status_code == 400


def test_search_crags_returns_hits_and_reuses_them(client, moderator_token, monkeypatch):
    _set_api_key()
    calls = []

    def fake_request(path: str):
        calls.append(path)
        return {
            "data": [
                {
                    "crag_id": 1000044430,
                    "crag_name": "Magic Wood",
                    "area_name": "Averstal",
                    "country_name": "Switzerland",
                    "distance_km": 1.26,
                }
            ]
        }

    monkeypatch.setattr("util.condicaster._request", fake_request)
    first = client.get("/api/condicaster/crags?lat=46.3404&lon=9.3404", token=moderator_token)
    second = client.get("/api/condicaster/crags?lat=46.3401&lon=9.3402", token=moderator_token)

    assert first.status_code == 200
    assert first.json["crags"] == [
        {
            "cragId": 1000044430,
            "name": "Magic Wood",
            "areaName": "Averstal",
            "countryName": "Switzerland",
            "distanceKm": 1.3,
        }
    ]
    assert second.json == first.json
    assert len(calls) == 1
