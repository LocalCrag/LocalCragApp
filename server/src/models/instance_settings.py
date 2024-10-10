import datetime
import uuid

from flask import current_app
from sqlalchemy.ext.hybrid import hybrid_property

from extensions import db
from sqlalchemy.dialects.postgresql import UUID


class InstanceSettings(db.Model):
    __tablename__ = 'instance_settings'

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
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
    arrow_color = db.Column(db.String(7), nullable=False, server_default='#FFE016')
    arrow_text_color = db.Column(db.String(7), nullable=False, server_default='#000000')
    arrow_highlight_color = db.Column(db.String(7), nullable=False, server_default='#FF0000')
    arrow_highlight_text_color = db.Column(db.String(7), nullable=False, server_default='#FFFFFF')
    bar_chart_color = db.Column(db.String(30), nullable=False, server_default='rgb(213, 30, 38)')
    matomo_tracker_url = db.Column(db.String(120), nullable=True)
    matomo_site_id = db.Column(db.String(120), nullable=True)
    maptiler_api_key = db.Column(db.String(120), nullable=True)

    @hybrid_property
    def superadmin_email(self) -> str:
        return current_app.config['SUPERADMIN_EMAIL']

    @classmethod
    def return_it(cls):
        return cls.query.first()
