from sqlalchemy.orm import declarative_mixin

from extensions import db


@declarative_mixin
class IsClosable:
    """
    Mixin for topo entities with closure schedules.

    ``closed`` / ``closed_reason`` are materialized by the closure scheduler from
    owned schedules and parent closure.
    """

    closed = db.Column(db.Boolean, nullable=False, default=False)
    closed_reason = db.Column(db.Text, nullable=True)
