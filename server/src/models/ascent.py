from sqlalchemy import func

from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID

from models.mixins.has_slug import HasSlug


class Ascent(BaseEntity):
    __tablename__ = 'ascents'

    line_id = db.Column(UUID(), db.ForeignKey('lines.id'), nullable=False)
    line = db.relationship('Line', lazy='select')  # todo join when querying for user list
    flash = db.Column(db.Boolean, nullable=False, default=False)
    with_kneepad = db.Column(db.Boolean, nullable=False, default=False)
    fa = db.Column(db.Boolean, nullable=False, default=False)
    soft = db.Column(db.Boolean, nullable=False, default=False)
    hard = db.Column(db.Boolean, nullable=False, default=False)
    grade_name = db.Column(db.String(120), nullable=False)
    grade_scale = db.Column(db.String(120), nullable=False)
    rating = db.Column(db.Integer, nullable=True)
    comment = db.Column(db.Text, nullable=True)
    year = db.Column(db.Integer, nullable=True)
    date = db.Column(db.Date(), nullable=True)
