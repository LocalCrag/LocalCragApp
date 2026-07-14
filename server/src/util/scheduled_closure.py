"""Closure schedules and materialized closed flags for closable topo entities.

Each crag, sector, area, and line may own multiple closure schedules:

* **ANNUAL** — recurring month/day window (may wrap across year end)
* **FIXED** — closed between ``start_date`` and ``end_date``
* **PERMANENT** — closed indefinitely

``closed`` and ``closure_is_permanent`` are **materialized** on each entity from
owned active schedules and parent closure (propagated top-down). They are
recomputed by ``apply_materialized_closures`` and after saves via
``finalize_closable_save``. Closure reasons and date ranges are
**computed at read time** from active schedules on the entity or its nearest
closing ancestor.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Optional, Protocol, Tuple
from uuid import UUID

from werkzeug.exceptions import BadRequest

from extensions import db
from models.area import Area
from models.closure_schedule import ClosureSchedule
from models.crag import Crag
from models.enums.closure_schedule_type_enum import ClosureScheduleTypeEnum
from models.line import Line
from models.sector import Sector
from util.instance_timezone import instance_local_date


class _ClosableLike(Protocol):
    id: UUID
    closed: bool
    closure_is_permanent: bool
    closure_schedules: list


def _day_of_year(month: int, day: int, year: int) -> int:
    """Return the 1-based day-of-year for a calendar date in ``year``."""
    return date(year, month, day).timetuple().tm_yday


def _clear_annual_fields(schedule: ClosureSchedule) -> None:
    schedule.start_month = None
    schedule.start_day = None
    schedule.end_month = None
    schedule.end_day = None


def _clear_fixed_fields(schedule: ClosureSchedule) -> None:
    schedule.start_date = None
    schedule.end_date = None


def _annual_window_active(
    start_month: int,
    start_day: int,
    end_month: int,
    end_day: int,
    on_date: date,
) -> bool:
    """Return whether an annual month/day window applies on ``on_date``."""
    start_doy = _day_of_year(start_month, start_day, on_date.year)
    end_doy = _day_of_year(end_month, end_day, on_date.year)
    today_doy = on_date.timetuple().tm_yday

    if start_doy <= end_doy:
        return start_doy <= today_doy <= end_doy
    return today_doy >= start_doy or today_doy <= end_doy


def is_schedule_active(schedule: ClosureSchedule, on_date: Optional[date] = None) -> bool:
    """Return whether ``schedule`` applies on ``on_date`` (defaults to server-local today)."""
    on_date = on_date or date.today()

    if schedule.schedule_type == ClosureScheduleTypeEnum.PERMANENT:
        return True

    if schedule.schedule_type == ClosureScheduleTypeEnum.FIXED:
        if schedule.start_date is None or schedule.end_date is None:
            return False
        return schedule.start_date <= on_date <= schedule.end_date

    if schedule.schedule_type != ClosureScheduleTypeEnum.ANNUAL:
        return False

    if None in (schedule.start_month, schedule.start_day, schedule.end_month, schedule.end_day):
        return False

    return _annual_window_active(
        schedule.start_month,
        schedule.start_day,
        schedule.end_month,
        schedule.end_day,
        on_date,
    )


def active_schedules(schedules: list[ClosureSchedule], on_date: Optional[date] = None) -> list[ClosureSchedule]:
    """Return schedules that are active on ``on_date``."""
    return [schedule for schedule in schedules if is_schedule_active(schedule, on_date)]


def has_own_closure_source(entity: _ClosableLike, on_date: Optional[date] = None) -> bool:
    """Return whether the entity has at least one active owned closure schedule."""
    return bool(active_schedules(entity.closure_schedules, on_date))


def _schedule_date_range_fields(schedule: ClosureSchedule) -> dict[str, Any]:
    """Return serialized date-range fields for FIXED and ANNUAL schedules."""
    if schedule.schedule_type == ClosureScheduleTypeEnum.FIXED:
        fields: dict[str, Any] = {}
        if schedule.start_date is not None:
            fields["startDate"] = schedule.start_date
        if schedule.end_date is not None:
            fields["endDate"] = schedule.end_date
        return fields

    if schedule.schedule_type == ClosureScheduleTypeEnum.ANNUAL:
        if None in (schedule.start_month, schedule.start_day, schedule.end_month, schedule.end_day):
            return {}
        return {
            "startMonth": schedule.start_month,
            "startDay": schedule.start_day,
            "endMonth": schedule.end_month,
            "endDay": schedule.end_day,
        }

    return {}


def _schedule_alert_key(schedule: ClosureSchedule) -> tuple[Any, ...]:
    date_fields = _schedule_date_range_fields(schedule)
    return (schedule.reason, tuple(sorted(date_fields.items())))


def schedule_closure_alerts(schedules: list[ClosureSchedule], on_date: Optional[date] = None) -> list[dict[str, Any]]:
    """Return display alerts for schedules active on ``on_date``."""
    alerts: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()
    for schedule in active_schedules(schedules, on_date):
        key = _schedule_alert_key(schedule)
        if key in seen:
            continue
        seen.add(key)
        alerts.append({"reason": schedule.reason, **_schedule_date_range_fields(schedule)})
    return alerts


def schedule_reasons(schedules: list[ClosureSchedule], on_date: Optional[date] = None) -> list[str]:
    """Return unique non-empty reasons from schedules active on ``on_date``."""
    reasons: list[str] = []
    seen: set[str] = set()
    for alert in schedule_closure_alerts(schedules, on_date):
        reason = alert.get("reason")
        if reason and reason not in seen:
            seen.add(reason)
            reasons.append(reason)
    return reasons


def own_closure_reasons(entity: _ClosableLike, on_date: Optional[date] = None) -> list[str]:
    """Return reasons from the entity's own active schedules."""
    return schedule_reasons(entity.closure_schedules, on_date)


def own_closure_state(entity: _ClosableLike, on_date: Optional[date] = None) -> Tuple[bool, Optional[str]]:
    """Return ``(closed, first_reason)`` from the entity's own active schedules only."""
    active = active_schedules(entity.closure_schedules, on_date)
    if active:
        reasons = own_closure_reasons(entity, on_date)
        return True, reasons[0] if reasons else None
    return False, None


def materialized_closure_state(
    entity: _ClosableLike,
    parent_closed: bool = False,
    on_date: Optional[date] = None,
) -> bool:
    """Return effective closure: own active schedule, else inherit ``parent_closed``."""
    own_closed, _ = own_closure_state(entity, on_date)
    if own_closed:
        return True
    return parent_closed


def ancestor_has_closure_source(entity, on_date: Optional[date] = None) -> Tuple[bool, Optional[str]]:
    """Return whether an ancestor has an active owned schedule and its reason."""
    if isinstance(entity, Line):
        area = Area.find_by_id(entity.area_id)
        return _ancestor_has_closure_source_from_area(area, on_date)
    if isinstance(entity, Area):
        return _ancestor_has_closure_source_from_area(entity, on_date, include_self=False)
    if isinstance(entity, Sector):
        sector = entity
        if has_own_closure_source(sector, on_date):
            _, reason = own_closure_state(sector, on_date)
            return True, reason
        crag = Crag.find_by_id(sector.crag_id)
        if crag and has_own_closure_source(crag, on_date):
            _, reason = own_closure_state(crag, on_date)
            return True, reason
    if isinstance(entity, Crag):
        return False, None
    return False, None


def _ancestor_has_closure_source_from_area(
    area: Area, on_date: Optional[date] = None, include_self: bool = True
) -> Tuple[bool, Optional[str]]:
    """Walk area → sector → crag for the nearest ancestor with an active owned schedule."""
    if include_self and has_own_closure_source(area, on_date):
        _, reason = own_closure_state(area, on_date)
        return True, reason
    sector = Sector.find_by_id(area.sector_id)
    if sector and has_own_closure_source(sector, on_date):
        _, reason = own_closure_state(sector, on_date)
        return True, reason
    if sector:
        crag = Crag.find_by_id(sector.crag_id)
        if crag and has_own_closure_source(crag, on_date):
            _, reason = own_closure_state(crag, on_date)
            return True, reason
    return False, None


def closed_by_parent_schedule(entity, on_date: Optional[date] = None) -> Tuple[bool, Optional[str]]:
    """Return whether ``entity`` is closed only because a parent has an active schedule."""
    if not entity.closed or has_own_closure_source(entity, on_date):
        return False, None
    has_ancestor, reason = ancestor_has_closure_source(entity, on_date)
    return has_ancestor, reason


def _ancestor_closure_alerts_from_area(
    area: Area, on_date: Optional[date] = None, include_self: bool = True
) -> list[dict[str, Any]]:
    """Collect alerts from the nearest ancestor with active owned schedules."""
    if include_self and has_own_closure_source(area, on_date):
        return schedule_closure_alerts(area.closure_schedules, on_date)
    sector = Sector.find_by_id(area.sector_id)
    if sector and has_own_closure_source(sector, on_date):
        return schedule_closure_alerts(sector.closure_schedules, on_date)
    if sector:
        crag = Crag.find_by_id(sector.crag_id)
        if crag and has_own_closure_source(crag, on_date):
            return schedule_closure_alerts(crag.closure_schedules, on_date)
    return []


def ancestor_closure_alerts(entity, on_date: Optional[date] = None) -> list[dict[str, Any]]:
    """Return closure alerts inherited from the nearest closing ancestor."""
    if isinstance(entity, Line):
        area = Area.find_by_id(entity.area_id)
        return _ancestor_closure_alerts_from_area(area, on_date, include_self=False)
    if isinstance(entity, Area):
        return _ancestor_closure_alerts_from_area(entity, on_date, include_self=False)
    if isinstance(entity, Sector):
        if has_own_closure_source(entity, on_date):
            return schedule_closure_alerts(entity.closure_schedules, on_date)
        crag = Crag.find_by_id(entity.crag_id)
        if crag and has_own_closure_source(crag, on_date):
            return schedule_closure_alerts(crag.closure_schedules, on_date)
    return []


def effective_closure_reason_alerts(entity: _ClosableLike, on_date: Optional[date] = None) -> list[dict[str, Any]]:
    """Return display alerts from own active schedules, else the nearest closing ancestor."""
    on_date = on_date or instance_local_date()

    own = schedule_closure_alerts(entity.closure_schedules, on_date)
    if own:
        return own

    inherited = ancestor_closure_alerts(entity, on_date)
    if inherited:
        return inherited

    return []


def _ancestor_active_schedules_from_area(
    area: Area, on_date: Optional[date] = None, include_self: bool = True
) -> list[ClosureSchedule]:
    """Return active schedules on the nearest closing ancestor of ``area``."""
    if include_self and has_own_closure_source(area, on_date):
        return active_schedules(area.closure_schedules, on_date)
    sector = Sector.find_by_id(area.sector_id)
    if sector and has_own_closure_source(sector, on_date):
        return active_schedules(sector.closure_schedules, on_date)
    if sector:
        crag = Crag.find_by_id(sector.crag_id)
        if crag and has_own_closure_source(crag, on_date):
            return active_schedules(crag.closure_schedules, on_date)
    return []


def effective_active_schedules(entity: _ClosableLike, on_date: Optional[date] = None) -> list[ClosureSchedule]:
    """Return schedules that currently drive closure for ``entity``."""
    on_date = on_date or instance_local_date()

    own = active_schedules(entity.closure_schedules, on_date)
    if own:
        return own

    if isinstance(entity, Line):
        area = Area.find_by_id(entity.area_id)
        return _ancestor_active_schedules_from_area(area, on_date, include_self=False)
    if isinstance(entity, Area):
        return _ancestor_active_schedules_from_area(entity, on_date, include_self=False)
    if isinstance(entity, Sector):
        if has_own_closure_source(entity, on_date):
            return active_schedules(entity.closure_schedules, on_date)
        crag = Crag.find_by_id(entity.crag_id)
        if crag and has_own_closure_source(crag, on_date):
            return active_schedules(crag.closure_schedules, on_date)
    return []


def computed_closure_is_permanent(entity: _ClosableLike, closed: bool, on_date: Optional[date] = None) -> bool:
    """Return whether effective closure on ``entity`` includes an active PERMANENT schedule."""
    if not closed:
        return False
    schedules = effective_active_schedules(entity, on_date)
    return any(schedule.schedule_type == ClosureScheduleTypeEnum.PERMANENT for schedule in schedules)


def effective_closure_reasons(entity: _ClosableLike, on_date: Optional[date] = None) -> list[str]:
    """Return all closure reason strings that apply to ``entity`` for display."""
    alerts = effective_closure_reason_alerts(entity, on_date)
    reasons: list[str] = []
    seen: set[str] = set()
    for alert in alerts:
        reason = alert.get("reason")
        if reason and reason not in seen:
            seen.add(reason)
            reasons.append(reason)
    return reasons


UPCOMING_CLOSURE_HORIZON_DAYS = 14


def next_schedule_activation_date(schedule: ClosureSchedule, on_date: date) -> Optional[date]:
    """Return the next calendar date when ``schedule`` becomes active, if known."""
    if schedule.schedule_type == ClosureScheduleTypeEnum.PERMANENT:
        return None
    if is_schedule_active(schedule, on_date):
        return None

    if schedule.schedule_type == ClosureScheduleTypeEnum.FIXED:
        if schedule.start_date and schedule.start_date > on_date:
            return schedule.start_date
        return None

    if schedule.schedule_type == ClosureScheduleTypeEnum.ANNUAL:
        if None in (schedule.start_month, schedule.start_day):
            return None
        start_this_year = date(on_date.year, schedule.start_month, schedule.start_day)
        if start_this_year > on_date:
            return start_this_year
        return date(on_date.year + 1, schedule.start_month, schedule.start_day)

    return None


def _append_upcoming_warnings(
    schedules: list[ClosureSchedule],
    on_date: date,
    horizon_end: date,
    seen: set[tuple[Any, ...]],
    warnings: list[dict[str, Any]],
) -> None:
    for schedule in schedules:
        activation = next_schedule_activation_date(schedule, on_date)
        if activation is None or activation > horizon_end:
            continue
        key = (activation, *_schedule_alert_key(schedule))
        if key in seen:
            continue
        seen.add(key)
        warnings.append(
            {
                "startsOn": activation,
                "reason": schedule.reason,
                **_schedule_date_range_fields(schedule),
            }
        )


def _inherited_closure_schedules(entity) -> list[ClosureSchedule]:
    """All schedules on ancestors that may propagate closure or upcoming warnings to ``entity``."""
    if isinstance(entity, Line):
        area = Area.find_by_id(entity.area_id)
        return _ancestor_closure_schedules_from_area(area, include_self=True)
    if isinstance(entity, Area):
        return _ancestor_closure_schedules_from_area(entity, include_self=False)
    if isinstance(entity, Sector):
        schedules: list[ClosureSchedule] = []
        crag = Crag.find_by_id(entity.crag_id)
        if crag:
            schedules.extend(crag.closure_schedules)
        return schedules
    return []


def _ancestor_closure_schedules_from_area(area: Area, include_self: bool) -> list[ClosureSchedule]:
    schedules: list[ClosureSchedule] = []
    if include_self and area:
        schedules.extend(area.closure_schedules)
    if not area:
        return schedules
    sector = Sector.find_by_id(area.sector_id)
    if sector:
        schedules.extend(sector.closure_schedules)
        crag = Crag.find_by_id(sector.crag_id)
        if crag:
            schedules.extend(crag.closure_schedules)
    return schedules


def upcoming_closure_warnings(
    entity: _ClosableLike,
    on_date: Optional[date] = None,
    horizon_days: int = UPCOMING_CLOSURE_HORIZON_DAYS,
) -> list[dict[str, Any]]:
    """Return closure schedules that activate within ``horizon_days`` and are not active yet."""
    on_date = on_date or instance_local_date()

    horizon_end = on_date + timedelta(days=horizon_days)
    warnings: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()

    _append_upcoming_warnings(entity.closure_schedules, on_date, horizon_end, seen, warnings)

    if not has_own_closure_source(entity, on_date):
        _append_upcoming_warnings(_inherited_closure_schedules(entity), on_date, horizon_end, seen, warnings)

    warnings.sort(key=lambda warning: warning["startsOn"])
    return warnings


def _validate_annual_window(data: dict[str, Any]) -> None:
    required = ("startMonth", "startDay", "endMonth", "endDay")
    for key in required:
        if data.get(key) is None:
            raise BadRequest(f"{key} is required for ANNUAL schedules")

    for key, low, high in (
        ("startMonth", 1, 12),
        ("endMonth", 1, 12),
        ("startDay", 1, 31),
        ("endDay", 1, 31),
    ):
        value = data[key]
        if not isinstance(value, int) or value < low or value > high:
            raise BadRequest(f"{key} must be between {low} and {high}")

    # Leap year: annual schedules store month/day only (picker year is ignored).
    validation_year = 2000
    for month_key, day_key in (("startMonth", "startDay"), ("endMonth", "endDay")):
        try:
            date(validation_year, data[month_key], data[day_key])
        except ValueError:
            raise BadRequest(f"Invalid calendar date for {month_key}/{day_key}")

    if _annual_payload_covers_entire_year(data):
        raise BadRequest("ANNUAL schedules must leave at least one open day per year; use PERMANENT instead")


def _annual_payload_covers_entire_year(data: dict[str, Any]) -> bool:
    """Return whether an ANNUAL month/day window leaves no open day in a leap year."""
    reference_year = 2000  # leap year so Feb 29 is included in the check
    for month in range(1, 13):
        for day in range(1, 32):
            try:
                on_date = date(reference_year, month, day)
            except ValueError:
                continue
            if not _annual_window_active(
                data["startMonth"],
                data["startDay"],
                data["endMonth"],
                data["endDay"],
                on_date,
            ):
                return False
    return True


def _validate_fixed_window(data: dict[str, Any]) -> None:
    start_date = data.get("startDate")
    end_date = data.get("endDate")
    if start_date is None or end_date is None:
        raise BadRequest("startDate and endDate are required for FIXED schedules")
    if not isinstance(start_date, date) or not isinstance(end_date, date):
        raise BadRequest("startDate and endDate must be valid dates")
    if start_date > end_date:
        raise BadRequest("startDate must be on or before endDate")


def validate_closure_schedule_payload(data: dict[str, Any]) -> None:
    """Validate a single closure schedule write payload; raises ``BadRequest`` on error."""
    schedule_type = data.get("scheduleType")
    if schedule_type not in {t.value for t in ClosureScheduleTypeEnum}:
        raise BadRequest("scheduleType must be ANNUAL, PERMANENT, or FIXED")

    if schedule_type == ClosureScheduleTypeEnum.PERMANENT.value:
        return

    if schedule_type == ClosureScheduleTypeEnum.FIXED.value:
        _validate_fixed_window(data)
        return

    _validate_annual_window(data)


def validate_closure_schedules_payload(schedules: list[dict[str, Any]]) -> None:
    """Validate every schedule in a write payload."""
    for schedule in schedules:
        validate_closure_schedule_payload(schedule)


def _schedule_from_payload(data: dict[str, Any], schedule: ClosureSchedule) -> None:
    """Apply validated payload fields onto a ``ClosureSchedule`` model instance."""
    schedule.schedule_type = ClosureScheduleTypeEnum(data["scheduleType"])
    schedule.reason = data.get("reason")

    if schedule.schedule_type == ClosureScheduleTypeEnum.PERMANENT:
        _clear_annual_fields(schedule)
        _clear_fixed_fields(schedule)
        return

    if schedule.schedule_type == ClosureScheduleTypeEnum.FIXED:
        _clear_annual_fields(schedule)
        schedule.start_date = data.get("startDate")
        schedule.end_date = data.get("endDate")
        return

    _clear_fixed_fields(schedule)
    schedule.start_month = data.get("startMonth")
    schedule.start_day = data.get("startDay")
    schedule.end_month = data.get("endMonth")
    schedule.end_day = data.get("endDay")


def _sync_closure_schedules(entity, schedules_data: list[dict[str, Any]], fk_field: str) -> None:
    """Create, update, or delete owned schedules so they match ``schedules_data``."""
    validate_closure_schedules_payload(schedules_data)
    incoming_ids = {str(item["id"]) for item in schedules_data if item.get("id")}

    for schedule in list(entity.closure_schedules):
        if str(schedule.id) not in incoming_ids:
            entity.closure_schedules.remove(schedule)

    for item in schedules_data:
        schedule_id = item.get("id")
        if schedule_id:
            schedule = ClosureSchedule.find_by_id(schedule_id)
            if schedule is None:
                raise BadRequest(f"Unknown closure schedule id {schedule_id}")
            _schedule_from_payload(item, schedule)
            db.session.add(schedule)
            continue

        schedule = ClosureSchedule()
        setattr(schedule, fk_field, entity.id)
        _schedule_from_payload(item, schedule)
        entity.closure_schedules.append(schedule)
        db.session.add(schedule)


def apply_closable_configuration(entity, data: dict[str, Any], fk_field: str) -> None:
    """Persist ``closureSchedules`` from a closable entity create/update payload."""
    db.session.add(entity)
    db.session.flush()
    _sync_closure_schedules(entity, data["closureSchedules"], fk_field)


def _set_materialized_closure(entity: _ClosableLike, closed: bool, closure_is_permanent: bool) -> None:
    """Write materialized ``closed`` and ``closure_is_permanent`` when they differ."""
    changed = False
    if entity.closed != closed:
        entity.closed = closed
        changed = True
    if entity.closure_is_permanent != closure_is_permanent:
        entity.closure_is_permanent = closure_is_permanent
        changed = True
    if changed:
        db.session.add(entity)


def apply_materialized_closures(on_date: Optional[date] = None) -> None:
    """Recompute ``closed`` and ``closure_is_permanent`` for the full topo tree and commit."""
    on_date = on_date or instance_local_date()

    for crag in Crag.query.all():
        crag_closed, _ = own_closure_state(crag, on_date)
        _set_materialized_closure(
            crag,
            crag_closed,
            computed_closure_is_permanent(crag, crag_closed, on_date),
        )

        for sector in crag.sectors:
            sector_closed = materialized_closure_state(sector, parent_closed=crag_closed, on_date=on_date)
            _set_materialized_closure(
                sector,
                sector_closed,
                computed_closure_is_permanent(sector, sector_closed, on_date),
            )

            for area in sector.areas:
                area_closed = materialized_closure_state(area, parent_closed=sector_closed, on_date=on_date)
                _set_materialized_closure(
                    area,
                    area_closed,
                    computed_closure_is_permanent(area, area_closed, on_date),
                )

                for line in area.lines:
                    line_closed = materialized_closure_state(line, parent_closed=area_closed, on_date=on_date)
                    _set_materialized_closure(
                        line,
                        line_closed,
                        computed_closure_is_permanent(line, line_closed, on_date),
                    )

    db.session.commit()


def materialize_own_closure(entity: _ClosableLike, on_date: Optional[date] = None) -> None:
    """Update ``closed`` and ``closure_is_permanent`` on ``entity`` from its own schedules only."""
    on_date = on_date or instance_local_date()
    closed, _ = own_closure_state(entity, on_date)
    _set_materialized_closure(
        entity,
        closed,
        computed_closure_is_permanent(entity, closed, on_date),
    )
    db.session.commit()


def request_closure_materialization() -> None:
    """Materialize descendant closure flags asynchronously when possible."""
    import sys

    from flask import current_app

    from scheduler_jobs.closure_materialization import enqueue_closure_materialization

    if "pytest" in sys.modules:
        apply_materialized_closures()
        return

    if not enqueue_closure_materialization(current_app._get_current_object()):
        apply_materialized_closures()


def finalize_closable_save(entity: _ClosableLike) -> None:
    """Materialize the saved entity's own closure flags, then queue full-tree materialization."""
    materialize_own_closure(entity)
    request_closure_materialization()
