import datetime

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy_continuum import version_class

from extensions import db
import uuid

from models.enums.change_type_enum import ChangeTypeEnum


class HistoryElement:

    __tablename__ = "history_elements"

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    time_created = db.Column(db.DateTime(), default=datetime.datetime.utcnow)
    entity_id = db.Column(UUID(), nullable=False)
    entity_type = db.Column(db.String, nullable=False)
    version_id = db.Column(db.Integer, nullable=False)
    previous_version_id = db.Column(db.Integer, nullable=False)
    change_type = db.Column(db.Enum(ChangeTypeEnum), nullable=False)

    @property
    def version(self):
        VersionClass = version_class(self.entity_type)
        return db.session.query(VersionClass).filter_by(id=self.version_id).first()
