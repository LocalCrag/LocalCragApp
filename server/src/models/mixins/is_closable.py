from sqlalchemy.orm import declarative_mixin

from extensions import db


@declarative_mixin
class IsClosable:
    """
    Mixin for topo entities with closure schedules.

    ``closed`` is materialized by the closure scheduler from owned schedules
    and parent closure. Reasons are computed from schedules at read time.
    """

    closed = db.Column(db.Boolean, nullable=False, default=False)
