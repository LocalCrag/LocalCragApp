from dataclasses import replace
from datetime import datetime, timezone, tzinfo
from enum import Enum
from uuid import UUID

from flask import current_app


def validate_datetime_in_future(value) -> bool:
    """
    Checks if the given datetime value is in the future.
    @param value: Value to check.
    @return: True if value is in the future.
    """
    now = datetime.now(tz=timezone.utc)
    return value.replace(tzinfo=timezone.utc) > now


def validate_uuid4(uuid_string: str) -> bool:
    """
    Validate that a UUID string is in
    fact a valid uuid4.
    Happily, the uuid module does the actual
    checking for us.
    It is vital that the 'version' kwarg be passed
    to the UUID() call, otherwise any 32-character
    hex string is considered valid.
    """

    try:
        val = UUID(uuid_string, version=4)
    except ValueError:
        # If it's a value error, then the string
        # is not a valid hex code for a UUID.
        return False

    # If the uuid_string is a valid hex code,
    # but an invalid uuid4,
    # the UUID.__init__ will convert it to a
    # valid uuid4. This is bad for validation purposes.

    return str(val) == uuid_string


def validate_is_enum_member(enum):
    """
    Returns a validator function that checks if a given value is a member of a specific enum.
    :param enum: Enum to check membership.
    :return: Validator function.
    """
    members = enum.__members__

    def validator(value: str) -> bool:
        return value in members

    return validator
