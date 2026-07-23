from enum import Enum


class DryingEnum(Enum):
    """
    How quickly a line dries after wet conditions.
    """

    FAST = "FAST"
    SLOW = "SLOW"
