"""Closure schedules and materialization into persisted closed flags.

Schedules are stored on closable topo entities (crag, sector, area, line). The
``closed`` / ``closed_reason`` columns are derived: recomputed from owned schedules
and parent closure via ``apply_materialized_closures`` / ``materialize_closures_now``.
API saves update the saved entity immediately and queue full-tree materialization
in the background scheduler when available.
"""

from __future__ import annotations

from datetime import date
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
    closed_reason: Optional[str]
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


def is_schedule_active(schedule: ClosureSchedule, on_date: Optional[date] = None) -> bool:
    """Return whether ``schedule`` applies on ``on_date`` (defaults to today)."""
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

    start_doy = _day_of_year(schedule.start_month, schedule.start_day, on_date.year)
    end_doy = _day_of_year(schedule.end_month, schedule.end_day, on_date.year)
    today_doy = on_date.timetuple().tm_yday

    if start_doy <= end_doy:
        return start_doy <= today_doy <= end_doy
    return today_doy >= start_doy or today_doy <= end_doy


def active_schedules(schedules: list[ClosureSchedule], on_date: Optional[date] = None) -> list[ClosureSchedule]:
    """Return schedules that are active on ``on_date``."""
    return [schedule for schedule in schedules if is_schedule_active(schedule, on_date)]


def has_own_closure_source(entity: _ClosableLike, on_date: Optional[date] = None) -> bool:
    """Return whether the entity has at least one active owned closure schedule."""
    return bool(active_schedules(entity.closure_schedules, on_date))


def own_closure_state(entity: _ClosableLike, on_date: Optional[date] = None) -> Tuple[bool, Optional[str]]:
    """Return closure contributed by the entity's own schedules, ignoring parents."""
    active = active_schedules(entity.closure_schedules, on_date)
    if active:
        return True, active[0].reason
    return False, None


def materialized_closure_state(
    entity: _ClosableLike,
    parent_closed: bool = False,
    parent_reason: Optional[str] = None,
    on_date: Optional[date] = None,
) -> Tuple[bool, Optional[str]]:
    """Return effective closure for ``entity``: own schedule wins, else inherit from parent."""
    own_closed, own_reason = own_closure_state(entity, on_date)
    if own_closed:
        return True, own_reason
    if parent_closed:
        return True, parent_reason
    return False, None


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

    year = date.today().year
    for month_key, day_key in (("startMonth", "startDay"), ("endMonth", "endDay")):
        try:
            date(year, data[month_key], data[day_key])
        except ValueError:
            raise BadRequest(f"Invalid calendar date for {month_key}/{day_key}")


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


def sync_closure_schedules(entity, schedules_data: list[dict[str, Any]], fk_field: str) -> None:
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
        db.session.add(schedule)


def apply_closable_configuration(entity, data: dict[str, Any], fk_field: str) -> None:
    """Persist ``closureSchedules`` from a closable entity create/update payload."""
    db.session.add(entity)
    db.session.flush()
    sync_closure_schedules(entity, list(data.get("closureSchedules") or []), fk_field)


def _set_materialized(entity: _ClosableLike, closed: bool, reason: Optional[str]) -> None:
    """Write materialized ``closed`` / ``closed_reason`` when they differ from computed values."""
    if entity.closed != closed or entity.closed_reason != reason:
        entity.closed = closed
        entity.closed_reason = reason
        db.session.add(entity)


def apply_materialized_closures(on_date: Optional[date] = None) -> None:
    """Recompute persisted ``closed`` flags for the full topo tree and commit."""
    on_date = on_date or instance_local_date()

    for crag in Crag.query.all():
        crag_closed, crag_reason = own_closure_state(crag, on_date)
        _set_materialized(crag, crag_closed, crag_reason)

        for sector in crag.sectors:
            sector_closed, sector_reason = materialized_closure_state(
                sector, parent_closed=crag_closed, parent_reason=crag_reason, on_date=on_date
            )
            _set_materialized(sector, sector_closed, sector_reason)

            for area in sector.areas:
                area_closed, area_reason = materialized_closure_state(
                    area, parent_closed=sector_closed, parent_reason=sector_reason, on_date=on_date
                )
                _set_materialized(area, area_closed, area_reason)

                for line in area.lines:
                    line_closed, line_reason = materialized_closure_state(
                        line, parent_closed=area_closed, parent_reason=area_reason, on_date=on_date
                    )
                    _set_materialized(line, line_closed, line_reason)

    db.session.commit()


def materialize_closures_now() -> None:
    """Apply closure schedules immediately using the instance-local calendar date."""
    apply_materialized_closures()


def materialize_own_closure(entity: _ClosableLike, on_date: Optional[date] = None) -> None:
    """Update only the saved entity's ``closed`` flag from its own schedules."""
    closed, reason = own_closure_state(entity, on_date)
    _set_materialized(entity, closed, reason)
    db.session.commit()


def request_closure_materialization() -> None:
    """Materialize descendant closure flags asynchronously when possible."""
    import sys

    from flask import current_app

    from schedulers import enqueue_closure_materialization

    if "pytest" in sys.modules:
        materialize_closures_now()
        return

    if not enqueue_closure_materialization(current_app._get_current_object()):
        materialize_closures_now()


def finalize_closable_save(entity: _ClosableLike) -> None:
    """Persist the saved entity's own closure state and queue full-tree materialization."""
    materialize_own_closure(entity)
    request_closure_materialization()
