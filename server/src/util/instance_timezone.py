from __future__ import annotations

from datetime import date, datetime
from typing import Optional

import pytz
from marshmallow import ValidationError

from models.instance_settings import InstanceSettings

DEFAULT_INSTANCE_TIMEZONE = "UTC"


def validate_timezone(value: str) -> None:
    if not value:
        raise ValidationError("timezone is required")
    try:
        pytz.timezone(value)
    except pytz.exceptions.UnknownTimeZoneError as exc:
        raise ValidationError(f"Invalid timezone '{value}'") from exc


def get_instance_timezone_name() -> str:
    settings = InstanceSettings.return_it()
    if settings and settings.timezone:
        return settings.timezone
    return DEFAULT_INSTANCE_TIMEZONE


def instance_local_date(at: Optional[datetime] = None) -> date:
    """Return the calendar date in the instance timezone for ``at`` (defaults to now, UTC)."""
    tz = pytz.timezone(get_instance_timezone_name())
    moment = at or datetime.now(pytz.utc)
    if moment.tzinfo is None:
        moment = pytz.utc.localize(moment)
    return moment.astimezone(tz).date()
