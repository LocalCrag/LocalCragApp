from extensions import db
from models.base_entity import BaseEntity


class Language(BaseEntity):
    """
    An available system language.
    """
    __tablename__ = 'languages'

    code = db.Column(db.String, nullable=False)
    is_default_language = db.Column(db.Boolean, nullable=False, default=False)


