from sqlalchemy import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property

from extensions import db
from models.ascent import Ascent
from models.base_entity import BaseEntity
from models.line import Line
from util.secret_service import SecretService


class Region(BaseEntity):
    """
    Model of a climbing region. Could be e.g. "Eifel". Contains one or more crags.
    """

    __tablename__ = "regions"

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    rules = db.Column(db.Text, nullable=True)
    image_id = db.Column(UUID(), db.ForeignKey("files.id"), nullable=True)
    image = db.relationship("File", lazy="joined", foreign_keys=[image_id])

    @hybrid_property
    def ascent_count(self):
        query = db.session.query(func.count(Ascent.id)).join(Line)
        query = SecretService.apply_line_filter(query)
        return query.scalar()

    @classmethod
    def return_it(cls):
        return cls.query.first()
