from enums.entity_types import EntityTypeEnum
from extensions import db
from models.base_entity import BaseEntity


class Media(BaseEntity):
    """
    Model of a media.
    """
    __tablename__ = 'medias'
    __entity_type__ = EntityTypeEnum.MEDIA

    original_filename = db.Column(db.String(120), nullable=False)
    filename = db.Column(db.String(120), nullable=False)
    width = db.Column(db.Integer, nullable=False)
    height = db.Column(db.Integer, nullable=False)
    thumbnail_xs = db.Column(db.Boolean, default=False)
    thumbnail_s = db.Column(db.Boolean, default=False)
    thumbnail_m = db.Column(db.Boolean, default=False)
    thumbnail_l = db.Column(db.Boolean, default=False)
    thumbnail_xl = db.Column(db.Boolean, default=False)

    def __init__(self):
        super(Media, self).__init__(self.__entity_type__)
