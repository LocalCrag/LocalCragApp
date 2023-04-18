from sqlalchemy.dialects.postgresql import JSON

from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID


class Line(BaseEntity):
    """
    Model of a line in a sector. Can be a boulder or route.
    """
    __tablename__ = 'lines'

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    video = db.Column(db.String(120), nullable=False)
    grade = db.Column(db.Int, nullable=False)
    type = db.Column(db.Enum, nullable=False)
    sitstart = db.Column(db.Boolean, nullable=False, default=False)
    eliminate = db.Column(db.Boolean, nullable=False, default=False)
    traverse = db.Column(db.Boolean, nullable=False, default=False)
    classic = db.Column(db.Boolean, nullable=False, default=False)
    linepath = db.Column(JSON, nullable=False)
    area_id = db.Column(UUID(), db.ForeignKey('areas.id'), nullable=False)

