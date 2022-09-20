from extensions import db
from models.base_entity import BaseEntity


class File(BaseEntity):
    """
    Model of a file. Video and image files will have thumbnails and height + width. All other will have those fields
    just set to null.
    """
    __tablename__ = 'medias'

    original_filename = db.Column(db.String(120), nullable=False)
    filename = db.Column(db.String(120), nullable=False)
    width = db.Column(db.Integer, nullable=False)
    height = db.Column(db.Integer, nullable=False)
    thumbnail_xs = db.Column(db.Boolean, default=False)
    thumbnail_s = db.Column(db.Boolean, default=False)
    thumbnail_m = db.Column(db.Boolean, default=False)
    thumbnail_l = db.Column(db.Boolean, default=False)
    thumbnail_xl = db.Column(db.Boolean, default=False)
