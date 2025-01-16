from sqlalchemy.orm import declarative_mixin

from extensions import db


@declarative_mixin
class IsClosable:
    """
    Mixin class that adds properties that are needed to mark a model as closed.
    """

    closed = db.Column(db.Boolean, nullable=False, default=False)
    closed_reason = db.Column(db.Text, nullable=True)