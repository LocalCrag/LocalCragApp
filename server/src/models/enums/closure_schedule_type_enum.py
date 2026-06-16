from enum import Enum


class ClosureScheduleTypeEnum(Enum):
    """How a closure schedule determines active periods."""

    ANNUAL = "ANNUAL"
    PERMANENT = "PERMANENT"
    FIXED = "FIXED"
