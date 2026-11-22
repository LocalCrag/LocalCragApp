"""CondiCaster lookup, inheritance, and cached condition refresh."""

from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from flask import current_app, g

from extensions import db
from models.area import Area
from models.condicaster_cache import CondicasterCache
from models.crag import Crag
from models.sector import Sector

logger = logging.getLogger(__name__)

_SEARCH_CACHE_SECONDS = 60 * 60
_search_cache: dict[tuple, tuple[float, list]] = {}

API_ROOT = "https://condicaster.wtf"
FORECAST_DAYS = 11
# Hourly rows after today. Today itself is refreshed each hour outside quiet hours.
HOURLY_FORECAST_DAYS = 7
# Later days, hourly and daily, are fetched at most once a day.
FORECAST_MAX_AGE = timedelta(hours=24)
# Local hours [23:00, 05:00) skip the hourly refresh.
QUIET_START_HOUR = 23
QUIET_END_HOUR = 5
# Leave room for the next hour's hourly fetches after a larger refresh.
DAILY_QUOTA_RESERVE = 24


class CondicasterError(Exception):
    def __init__(self, status: int):
        super().__init__(f"CondiCaster request failed ({status})")
        self.status = status


class CondicasterRateLimited(CondicasterError):
    def __init__(self):
        super().__init__(429)


def apply_condicaster_link(entity, crag_id: int | None, name: str | None) -> None:
    """Store the CondiCaster id for fetching and the name for display."""
    cleaned = (name or "").strip() or None
    entity.condicaster_crag_id = crag_id
    entity.condicaster_crag_name = cleaned if crag_id else None


def effective_condicaster_crag_id(entity) -> int | None:
    """Own CondiCaster id, otherwise the nearest ancestor's id."""
    if isinstance(entity, Area):
        if entity.condicaster_crag_id:
            return entity.condicaster_crag_id
        return effective_condicaster_crag_id(entity.sector) if entity.sector is not None else None
    if isinstance(entity, Sector):
        if entity.condicaster_crag_id:
            return entity.condicaster_crag_id
        return entity.crag.condicaster_crag_id if entity.crag is not None else None
    if isinstance(entity, Crag):
        return entity.condicaster_crag_id
    return None


def condicaster_enabled() -> bool:
    """True when this instance has a CondiCaster API key.

    Cached for the request so list payloads do not look the key up per row.
    """
    enabled = getattr(g, "_condicaster_enabled", None)
    if enabled is None:
        enabled = bool(_api_key())
        g._condicaster_enabled = enabled
    return enabled


def cached_scores() -> dict[int, float | None]:
    """Request-scoped map of crag id to the cached current CondiScore."""
    scores = getattr(g, "_condicaster_scores", None)
    if scores is None:
        scores = {
            row.condicaster_crag_id: None if row.current_condiscore is None else float(row.current_condiscore)
            for row in CondicasterCache.query.all()
        }
        g._condicaster_scores = scores
    return scores


def resolve_entity(level: str, slug: str):
    if level == "area":
        return Area.find_by_slug(slug)
    if level == "sector":
        return Sector.find_by_slug(slug)
    if level == "crag":
        return Crag.find_by_slug(slug)
    return None


def conditions_payload(entity) -> dict:
    crag_id = effective_condicaster_crag_id(entity)
    empty = {
        "condicasterCragId": crag_id,
        "timezone": None,
        "currentCondiscore": None,
        "currentValidAt": None,
        "hourly": [],
        "daily": [],
        "hourlyFetchedAt": None,
        "dailyFetchedAt": None,
    }
    if crag_id is None:
        return empty
    cache = db.session.get(CondicasterCache, crag_id)
    if cache is None:
        return empty
    return {
        "condicasterCragId": crag_id,
        "timezone": cache.timezone,
        "currentCondiscore": None if cache.current_condiscore is None else float(cache.current_condiscore),
        "currentValidAt": _iso(cache.current_valid_at),
        "hourly": cache.hourly_json or [],
        "daily": cache.daily_json or [],
        "hourlyFetchedAt": _iso(cache.hourly_fetched_at),
        "dailyFetchedAt": _iso(cache.daily_fetched_at),
    }


def search_locations(query: str, limit: int = 8) -> list[dict]:
    """CondiCaster spots whose name matches a typed query.

    The public location catalogue is what condicaster.wtf itself searches.
    The developer crag endpoint only accepts a GPS radius, so a name such as
    "kottenheim" never reaches Kottenheimer Winfeld through that route.
    """
    query = " ".join((query or "").split())
    if len(query) < 2:
        return []
    limit = min(20, max(1, int(limit)))
    cache_key = ("q", query.casefold(), limit)
    cached = _search_cache.get(cache_key)
    now = time.time()
    if cached is not None and now - cached[0] < _SEARCH_CACHE_SECONDS:
        return cached[1]

    payload = _public_json(f"/locations?q={urllib.parse.quote(query)}")
    if not isinstance(payload, list):
        raise CondicasterError(0)
    hits = []
    for item in payload:
        hit = _location_hit(item)
        if hit is None:
            continue
        hits.append(hit)
        if len(hits) >= limit:
            break
    _search_cache[cache_key] = (now, hits)
    return hits


def search_crags(lat: float, lon: float, radius_km: int = 10, limit: int = 8) -> list[dict]:
    """Nearby CondiCaster crags for a GPS point.

    Identical searches are reused for an hour. Each uncached search counts as
    one CondiCaster request.
    """
    if not _api_key():
        raise CondicasterError(0)

    radius_km = min(10, max(1, int(radius_km)))
    limit = min(20, max(1, int(limit)))
    cache_key = (round(lat, 3), round(lon, 3), radius_km, limit)
    cached = _search_cache.get(cache_key)
    now = time.time()
    if cached is not None and now - cached[0] < _SEARCH_CACHE_SECONDS:
        return cached[1]

    payload = _request(f"/api/v1/crags?lat={lat}&lon={lon}&radius_km={radius_km}&limit={limit}")
    crags = [_search_hit(item) for item in payload.get("data") or []]
    _search_cache[cache_key] = (now, crags)
    return crags


def _location_hit(item: dict) -> dict | None:
    if not isinstance(item, dict):
        return None
    raw_id = item.get("condicaster_id") or item.get("loc_id")
    name = str(item.get("name") or "").strip()
    try:
        crag_id = int(raw_id)
    except (TypeError, ValueError):
        return None
    if crag_id <= 0 or not name:
        return None
    area = item.get("area") or None
    country = item.get("country") or None
    return {
        "cragId": crag_id,
        "name": name,
        "areaName": area,
        "countryName": country,
        "distanceKm": None,
    }


def _search_hit(item: dict) -> dict:
    distance = item.get("distance_km")
    return {
        "cragId": item.get("crag_id"),
        "name": item.get("crag_name"),
        "areaName": item.get("area_name"),
        "countryName": item.get("country_name"),
        "distanceKm": None if distance is None else round(float(distance), 1),
    }


def enqueue_condicaster_refresh(crag_id: int | None) -> None:
    if not crag_id:
        return
    from scheduler_jobs.condicaster import enqueue

    enqueue(current_app._get_current_object(), crag_id)


def refresh_all() -> None:
    if not _api_key():
        logger.info("CondiCaster refresh skipped: no API key is configured.")
        return

    ids = _configured_crag_ids()
    for crag_id in ids:
        try:
            refresh_one(crag_id)
        except CondicasterRateLimited:
            logger.warning("CondiCaster rate limit reached. Keeping the existing cache.")
            return


def refresh_one(crag_id: int) -> None:
    if not _api_key():
        return

    cache = db.session.get(CondicasterCache, crag_id)
    if cache is None:
        cache = CondicasterCache(condicaster_crag_id=crag_id)
        db.session.add(cache)

    local_date = _local_today(cache.timezone)
    if cache.hourly_json and _in_quiet_hours(cache.timezone):
        logger.info("CondiCaster hourly refresh skipped for %s: quiet hours.", crag_id)
    else:
        try:
            hourly = _request(f"/api/v1/crags/{crag_id}/conditions?date={local_date.isoformat()}&resolution=hourly")
        except CondicasterRateLimited:
            db.session.rollback()
            raise
        except CondicasterError as exc:
            cache.last_error = str(exc.status)
            db.session.commit()
            return

        timezone_name = hourly.get("timezone") or cache.timezone
        corrected = _local_today(timezone_name)
        if corrected != local_date:
            local_date = corrected
            try:
                hourly = _request(f"/api/v1/crags/{crag_id}/conditions?date={local_date.isoformat()}&resolution=hourly")
            except CondicasterRateLimited:
                db.session.rollback()
                raise
            except CondicasterError as exc:
                cache.last_error = str(exc.status)
                db.session.commit()
                return

        _apply_hourly(cache, hourly, local_date)
        db.session.commit()

    _refresh_forecast_hourly(cache, crag_id, local_date)

    if _daily_is_fresh(cache):
        return
    if not _daily_quota_allows():
        logger.info("CondiCaster daily forecast skipped for %s: quota reserve reached.", crag_id)
        return

    days = []
    for offset in range(FORECAST_DAYS):
        day = local_date + timedelta(days=offset)
        try:
            payload = _request(f"/api/v1/crags/{crag_id}/conditions?date={day.isoformat()}&resolution=daily")
        except CondicasterRateLimited:
            if days:
                cache.daily_json = days
                cache.daily_fetched_at = _utcnow()
                db.session.commit()
            else:
                db.session.rollback()
            raise
        except CondicasterError:
            break
        days.extend(payload.get("data") or [])
        time.sleep(0.4)
        if payload.get("timezone"):
            cache.timezone = payload["timezone"]

    if days:
        cache.daily_json = days
        cache.daily_fetched_at = _utcnow()
        cache.last_error = None
        db.session.commit()


def _configured_crag_ids() -> list[int]:
    ids = set()
    for model in (Crag, Sector, Area):
        rows = db.session.query(model.condicaster_crag_id).filter(model.condicaster_crag_id.isnot(None)).all()
        ids.update(row[0] for row in rows)
    return sorted(ids)


def _refresh_forecast_hourly(cache: CondicasterCache, crag_id: int, local_date: date) -> None:
    """Fetch hourly conditions for the next days, at most once every 24 hours."""
    if _forecast_hourly_is_fresh(cache):
        return
    if not _quota_allows(HOURLY_FORECAST_DAYS):
        logger.info("CondiCaster hourly forecast skipped for %s: quota reserve reached.", crag_id)
        return

    collected: list[tuple[date, list]] = []
    for offset in range(1, HOURLY_FORECAST_DAYS + 1):
        day = local_date + timedelta(days=offset)
        try:
            payload = _request(f"/api/v1/crags/{crag_id}/conditions?date={day.isoformat()}&resolution=hourly")
        except CondicasterRateLimited:
            _store_forecast_hours(cache, collected, local_date, complete=False)
            raise
        except CondicasterError:
            break
        collected.append((day, _hours_for_date(payload.get("data") or [], day)))
        time.sleep(0.4)
        if payload.get("timezone"):
            cache.timezone = payload["timezone"]

    _store_forecast_hours(cache, collected, local_date, complete=len(collected) == HOURLY_FORECAST_DAYS)


def _store_forecast_hours(
    cache: CondicasterCache,
    collected: list[tuple[date, list]],
    local_date: date,
    complete: bool,
) -> None:
    if not collected:
        db.session.rollback()
        return
    incoming = [hour for _, hours in collected for hour in hours]
    replaced = {day.isoformat() for day, _ in collected}
    cache.hourly_json = _merged_hours(cache.hourly_json, incoming, replaced, local_date)
    if complete:
        cache.forecast_hourly_fetched_at = _utcnow()
        cache.last_error = None
    db.session.commit()


def _apply_hourly(cache: CondicasterCache, payload: dict, local_date: date) -> None:
    hours = _hours_for_date(payload.get("data") or [], local_date)
    cache.timezone = payload.get("timezone") or cache.timezone
    cache.hourly_json = _merged_hours(cache.hourly_json, hours, {local_date.isoformat()}, local_date)
    cache.hourly_date = local_date
    cache.hourly_fetched_at = _utcnow()
    cache.last_error = None
    current = _current_hour(cache.hourly_json)
    if current is None:
        cache.current_condiscore = None
        cache.current_valid_at = None
        return
    cache.current_condiscore = current.get("condiscore")
    cache.current_valid_at = _naive_utc(current.get("valid_at"))


def _current_hour(hours: list[dict]) -> dict | None:
    now = datetime.now(timezone.utc)
    current = None
    for hour in hours:
        valid_at = _aware_utc(hour.get("valid_at"))
        if valid_at is None:
            continue
        if valid_at <= now:
            current = hour
        else:
            break
    if current is None and hours:
        return hours[0]
    return current


def _hours_for_date(hours: list[dict], local_date: date) -> list[dict]:
    day = local_date.isoformat()
    stamped = []
    for hour in hours:
        if hour.get("local_date") and hour.get("local_date") != day:
            continue
        stamped.append({**hour, "local_date": day})
    return stamped


def _merged_hours(existing, incoming: list[dict], replaced_dates: set[str], local_today: date) -> list[dict]:
    today = local_today.isoformat()
    kept = []
    for hour in existing or []:
        local = hour.get("local_date")
        if not local or local < today or local in replaced_dates:
            continue
        kept.append(hour)
    merged = kept + list(incoming)
    merged.sort(key=lambda hour: hour.get("valid_at") or "")
    return merged


def _forecast_hourly_is_fresh(cache: CondicasterCache) -> bool:
    return _is_fresh(cache.forecast_hourly_fetched_at, cache.hourly_json, FORECAST_MAX_AGE)


def _daily_is_fresh(cache: CondicasterCache) -> bool:
    return _is_fresh(cache.daily_fetched_at, cache.daily_json, FORECAST_MAX_AGE)


def _is_fresh(fetched_at: datetime | None, payload, max_age: timedelta) -> bool:
    if fetched_at is None or not payload:
        return False
    return _utcnow() - fetched_at < max_age


def _in_quiet_hours(timezone_name: str | None) -> bool:
    """True from 23:00 until 05:00 in the crag's timezone."""
    if not timezone_name:
        return False
    hour = _local_now(timezone_name).hour
    return hour >= QUIET_START_HOUR or hour < QUIET_END_HOUR


def _local_now(timezone_name: str | None) -> datetime:
    aware = _utcnow().replace(tzinfo=timezone.utc)
    try:
        return aware.astimezone(ZoneInfo(timezone_name))
    except Exception:
        logger.warning("Unknown CondiCaster timezone %s", timezone_name)
        return aware


def _daily_quota_allows() -> bool:
    return _quota_allows(FORECAST_DAYS)


def _quota_allows(requests_needed: int) -> bool:
    try:
        usage = _request("/api/v1/developer/usage")
    except CondicasterError:
        return False
    remaining = usage.get("remaining")
    if remaining is None:
        return True
    return remaining >= requests_needed + DAILY_QUOTA_RESERVE


def _public_json(path: str):
    request = urllib.request.Request(
        f"{API_ROOT}{path}",
        headers={"Accept": "application/json", "User-Agent": "localcrag"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            raise CondicasterRateLimited() from None
        raise CondicasterError(exc.code) from None
    except urllib.error.URLError as exc:
        raise CondicasterError(0) from exc


def _request(path: str) -> dict:
    key = _api_key()
    request = urllib.request.Request(
        f"{API_ROOT}{path}",
        headers={
            "Authorization": f"Bearer {key}",
            "Accept": "application/json",
            "User-Agent": "localcrag",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as exc:
        if exc.code == 429:
            raise CondicasterRateLimited() from None
        raise CondicasterError(exc.code) from None
    except urllib.error.URLError as exc:
        raise CondicasterError(0) from exc


def _api_key() -> str:
    from models.instance_settings import InstanceSettings

    settings = InstanceSettings.return_it()
    if settings is None:
        return ""
    return (settings.condicaster_api_key or "").strip()


def _local_today(timezone_name: str | None) -> date:
    return _as_local_date(_utcnow(), timezone_name)


def _as_local_date(value: datetime, timezone_name: str | None) -> date:
    aware = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if timezone_name:
        try:
            return aware.astimezone(ZoneInfo(timezone_name)).date()
        except Exception:
            logger.warning("Unknown CondiCaster timezone %s", timezone_name)
    return aware.astimezone(timezone.utc).date()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _aware_utc(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _naive_utc(value: str | None) -> datetime | None:
    parsed = _aware_utc(value)
    if parsed is None:
        return None
    return parsed.replace(tzinfo=None)


def _iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
