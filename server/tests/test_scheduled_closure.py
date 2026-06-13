from datetime import date

import pytest
from werkzeug.exceptions import BadRequest

from models.enums.closure_schedule_type_enum import ClosureScheduleTypeEnum
from util.scheduled_closure import (
    active_schedules,
    closed_by_parent_schedule,
    effective_closure_reason_alerts,
    effective_closure_reasons,
    has_own_closure_source,
    is_schedule_active,
    materialized_closure_state,
    next_schedule_activation_date,
    own_closure_reasons,
    own_closure_state,
    upcoming_closure_warnings,
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
    assert own_closure_reasons(entity) == ["Permanent"]


def test_multiple_active_schedule_reasons_are_all_returned():
    entity = _StubClosable()
    entity.closure_schedules = [
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.PERMANENT,
            reason="Maintenance",
        ),
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.FIXED,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            reason="Renovation",
        ),
    ]
    entity.closed = True
    assert own_closure_reasons(entity, on_date=date(2026, 6, 1)) == [
        "Maintenance",
        "Renovation",
    ]
    assert effective_closure_reasons(entity, on_date=date(2026, 6, 1)) == [
        "Maintenance",
        "Renovation",
    ]


def test_duplicate_schedule_reasons_are_deduped():
    entity = _StubClosable()
    entity.closure_schedules = [
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.PERMANENT,
            reason="Maintenance",
        ),
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.FIXED,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 12, 31),
            reason="Maintenance",
        ),
    ]
    entity.closed = True
    assert own_closure_reasons(entity, on_date=date(2026, 6, 1)) == ["Maintenance"]


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
    assert materialized_closure_state(entity, parent_closed=True) is True


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


def test_next_fixed_schedule_activation_date():
    schedule = _StubSchedule(
        schedule_type=ClosureScheduleTypeEnum.FIXED,
        start_date=date(2026, 6, 10),
        end_date=date(2026, 6, 30),
    )
    assert next_schedule_activation_date(schedule, date(2026, 6, 1)) == date(2026, 6, 10)
    assert next_schedule_activation_date(schedule, date(2026, 6, 10)) is None


def test_upcoming_fixed_schedule_within_horizon():
    entity = _StubClosable()
    entity.closure_schedules = [
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.FIXED,
            start_date=date(2026, 6, 10),
            end_date=date(2026, 6, 30),
            reason="Renovation",
        )
    ]
    warnings = upcoming_closure_warnings(entity, on_date=date(2026, 6, 1))
    assert len(warnings) == 1
    assert warnings[0]["startsOn"] == date(2026, 6, 10)
    assert warnings[0]["reason"] == "Renovation"


def test_upcoming_fixed_schedule_outside_horizon():
    entity = _StubClosable()
    entity.closure_schedules = [
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.FIXED,
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 31),
            reason="Renovation",
        )
    ]
    assert upcoming_closure_warnings(entity, on_date=date(2026, 6, 1)) == []


def test_upcoming_annual_schedule_within_horizon():
    entity = _StubClosable()
    entity.closure_schedules = [
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.ANNUAL,
            start_month=6,
            start_day=10,
            end_month=8,
            end_day=31,
            reason="Bird nesting",
        )
    ]
    warnings = upcoming_closure_warnings(entity, on_date=date(2026, 6, 1))
    assert len(warnings) == 1
    assert warnings[0]["startsOn"] == date(2026, 6, 10)


def test_upcoming_warnings_shown_alongside_active_closure():
    entity = _StubClosable()
    entity.closed = True
    entity.closure_schedules = [
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.PERMANENT,
            reason="Maintenance",
        ),
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.FIXED,
            start_date=date(2026, 6, 10),
            end_date=date(2026, 6, 30),
            reason="Renovation",
        ),
    ]
    on_date = date(2026, 6, 1)

    alerts = effective_closure_reason_alerts(entity, on_date=on_date)
    assert len(alerts) == 1
    assert alerts[0]["reason"] == "Maintenance"

    warnings = upcoming_closure_warnings(entity, on_date=on_date)
    assert len(warnings) == 1
    assert warnings[0]["startsOn"] == date(2026, 6, 10)
    assert warnings[0]["reason"] == "Renovation"


def test_active_alerts_without_materialized_closed_flag():
    entity = _StubClosable()
    entity.closed = False
    entity.closure_schedules = [
        _StubSchedule(
            schedule_type=ClosureScheduleTypeEnum.PERMANENT,
            reason="Maintenance",
        )
    ]

    alerts = effective_closure_reason_alerts(entity, on_date=date(2026, 6, 1))
    assert alerts == [{"reason": "Maintenance"}]
