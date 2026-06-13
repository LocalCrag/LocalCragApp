from datetime import date

import pytest
from werkzeug.exceptions import BadRequest

from models.enums.closure_schedule_type_enum import ClosureScheduleTypeEnum
from util.scheduled_closure import (
    active_schedules,
    closed_by_parent_schedule,
    has_own_closure_source,
    is_schedule_active,
    materialized_closure_state,
    own_closure_state,
    validate_closure_schedule_payload,
)


class _StubSchedule:
    def __init__(self, **kwargs):
        self.schedule_type = kwargs.get("schedule_type", ClosureScheduleTypeEnum.ANNUAL)
        self.reason = kwargs.get("reason")
        self.start_date = kwargs.get("start_date")
        self.end_date = kwargs.get("end_date")
        self.start_month = kwargs.get("start_month")
        self.start_day = kwargs.get("start_day")
        self.end_month = kwargs.get("end_month")
        self.end_day = kwargs.get("end_day")


class _StubClosable:
    id = None
    closed = False
    closed_reason = None
    closure_schedules = []


def test_annual_schedule_active_in_window():
    schedule = _StubSchedule(
        schedule_type=ClosureScheduleTypeEnum.ANNUAL,
        start_month=3,
        start_day=1,
        end_month=5,
        end_day=31,
    )
    assert is_schedule_active(schedule, on_date=date(2026, 4, 15))
    assert not is_schedule_active(schedule, on_date=date(2026, 6, 1))


def test_permanent_schedule_always_active():
    schedule = _StubSchedule(
        schedule_type=ClosureScheduleTypeEnum.PERMANENT,
        reason="Maintenance",
    )
    assert is_schedule_active(schedule, on_date=date(2026, 4, 30))
    assert is_schedule_active(schedule, on_date=date(2030, 1, 1))


def test_fixed_schedule_active_in_date_window():
    schedule = _StubSchedule(
        schedule_type=ClosureScheduleTypeEnum.FIXED,
        start_date=date(2026, 3, 1),
        end_date=date(2026, 5, 31),
        reason="Renovation",
    )
    assert is_schedule_active(schedule, on_date=date(2026, 4, 15))
    assert not is_schedule_active(schedule, on_date=date(2026, 6, 1))
    assert not is_schedule_active(schedule, on_date=date(2025, 4, 15))


def test_multiple_schedules_any_active():
    schedules = [
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.ANNUAL,
            start_month=1,
            start_day=1,
            end_month=1,
            end_day=15,
        ),
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.PERMANENT,
        ),
    ]
    assert len(active_schedules(schedules, on_date=date(2026, 3, 1))) == 1
    assert active_schedules(schedules, on_date=date(2026, 3, 1))[0].schedule_type == ClosureScheduleTypeEnum.PERMANENT
    assert len(active_schedules(schedules, on_date=date(2026, 6, 2))) == 1


def test_permanent_schedule_closes_entity():
    entity = _StubClosable()
    entity.closure_schedules = [
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.PERMANENT,
            reason="Permanent",
        )
    ]
    assert own_closure_state(entity) == (True, "Permanent")


def test_permanent_payload_accepts_minimal_fields():
    validate_closure_schedule_payload({"scheduleType": "PERMANENT"})


def test_fixed_payload_requires_date_window():
    validate_closure_schedule_payload(
        {
            "scheduleType": "FIXED",
            "startDate": date(2026, 1, 1),
            "endDate": date(2026, 3, 31),
        }
    )
    with pytest.raises(BadRequest):
        validate_closure_schedule_payload(
            {
                "scheduleType": "FIXED",
                "startDate": date(2026, 3, 31),
                "endDate": date(2026, 1, 1),
            }
        )


def test_materialized_inherits_parent_closure():
    entity = _StubClosable()
    closed, reason = materialized_closure_state(entity, parent_closed=True, parent_reason="Parent nesting season")
    assert closed is True
    assert reason == "Parent nesting season"


def test_open_when_no_schedule():
    entity = _StubClosable()
    assert own_closure_state(entity) == (False, None)
    assert has_own_closure_source(entity) is False


def test_validate_annual_requires_full_window():
    with pytest.raises(BadRequest):
        validate_closure_schedule_payload(
            {
                "scheduleType": "ANNUAL",
                "startMonth": 1,
                "startDay": 1,
            }
        )


def test_closed_by_parent_schedule_without_own_source():
    entity = _StubClosable()
    entity.closed = True
    assert closed_by_parent_schedule(entity)[0] is False
