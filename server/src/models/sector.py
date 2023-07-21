from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID


class Sector(BaseEntity):
    """
    Model of a climbing crag's sector. Could be e.g. "Mordor". Contains one or more areas.
    """
    __tablename__ = 'sectors'

    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    short_description = db.Column(db.Text, nullable=True)
    crag_id = db.Column(UUID(), db.ForeignKey('crags.id'), nullable=False)
    slug = db.Column(db.String(120), nullable=False)
    portrait_image_id = db.Column(UUID(), db.ForeignKey('files.id'), nullable=True)
    portrait_image = db.relationship('File', lazy='joined')

    @classmethod
    def find_by_slug(cls, slug, crag_id):
        entity = cls.query.filter_by(slug=slug, crag_id=crag_id).first()

        if not entity:
            raise NotFound()

        return entity


