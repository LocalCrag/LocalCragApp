import uuid

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy_utils import generic_relationship

from extensions import db


class Tag(db.Model):

    __tablename__ = "tags"

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    object_type = db.Column(db.Unicode(255)) # todo use enum
    object_id = db.Column(UUID())
    object = generic_relationship(object_type, object_id)
