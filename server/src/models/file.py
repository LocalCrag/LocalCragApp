from flask import current_app
from sqlalchemy.ext.hybrid import hybrid_property

from extensions import db
from models.base_entity import BaseEntity


class File(BaseEntity):
    """
    Model of a file. Video and image files will have thumbnails and height + width. All other will have those fields
    just set to null.
    """
    __tablename__ = 'files'

    original_filename = db.Column(db.String(120), nullable=False)
    filename = db.Column(db.String(120), nullable=False)
    width = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Integer, nullable=True)
    thumbnail_xs = db.Column(db.Boolean, nullable=True)
    thumbnail_s = db.Column(db.Boolean, nullable=True)
    thumbnail_m = db.Column(db.Boolean, nullable=True)
    thumbnail_l = db.Column(db.Boolean, nullable=True)
    thumbnail_xl = db.Column(db.Boolean, nullable=True)

    @hybrid_property
    def filename_with_host(self):
        return self.filename
        endpoint = current_app.config['SPACES_ENDPOINT']
        if current_app.config['SPACES_ACCESS_ENDPOINT']:
            endpoint = current_app.config['SPACES_ACCESS_ENDPOINT']
        protocol, host = endpoint.split('://')
        result = '{}://{}.{}/{}'.format(
            protocol,
            current_app.config['SPACES_BUCKET'],
            host,
            self.filename
        )
        return result
