import datetime
import uuid

from sqlalchemy import func

from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID

from models.mixins.has_slug import HasSlug


class InstanceSettings(db.Model):
    __tablename__ = 'instance_settings'

    id = db.Column(UUID(), default=lambda u: str(uuid.uuid4()), unique=True, primary_key=True)
    time_updated = db.Column(db.DateTime(), onupdate=datetime.datetime.utcnow)
    instance_name = db.Column(db.String(120), nullable=False)
    copyright_owner = db.Column(db.String(120), nullable=False)
    youtube_url = db.Column(db.String(120), nullable=True)
    instagram_url = db.Column(db.String(120), nullable=True)
    logo_image_id = db.Column(UUID(), db.ForeignKey('files.id'), nullable=True)
    logo_image = db.relationship('File', lazy='joined', foreign_keys=[logo_image_id])
    favicon_image_id = db.Column(UUID(), db.ForeignKey('files.id'), nullable=True)
    favicon_image = db.relationship('File', lazy='joined', foreign_keys=[favicon_image_id])
    auth_bg_image_id = db.Column(UUID(), db.ForeignKey('files.id'), nullable=True)
    auth_bg_image = db.relationship('File', lazy='joined', foreign_keys=[auth_bg_image_id])
    main_bg_image_id = db.Column(UUID(), db.ForeignKey('files.id'), nullable=True)
    main_bg_image = db.relationship('File', lazy='joined', foreign_keys=[main_bg_image_id])

    @classmethod
    def return_it(cls):
        return cls.query.first()
