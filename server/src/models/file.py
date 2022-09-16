from enums.entity_types import EntityTypeEnum
from extensions import db
from models.base_entity import BaseEntity


class File(BaseEntity):
    """
    Model of a file.
    """
    __tablename__ = 'files'
    __entity_type__ = EntityTypeEnum.FILE

    original_filename = db.Column(db.String(120), nullable=False)
    filename = db.Column(db.String(120), nullable=False)

    def __init__(self):
        super(File, self).__init__(self.__entity_type__)
