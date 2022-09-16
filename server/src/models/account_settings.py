from enums.entity_types import EntityTypeEnum
from extensions import db
from models.base_entity import BaseEntity


class AccountSettings(BaseEntity):
    """
    Keeps settings of a user account.
    """
    __tablename__ = 'account_settings'
    __entity_type__ = EntityTypeEnum.ACCOUNT

    def __init__(self):  # pragma: no cover
        super(AccountSettings, self).__init__(self.__entity_type__)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    language_id = db.Column(db.Integer, db.ForeignKey('languages.id'), nullable=False)
    language = db.relationship('Language')
    color_scheme = db.Column(db.String, nullable=False)
    avatar_id = db.Column(db.Integer, db.ForeignKey('medias.id'), nullable=True)
    avatar = db.relationship('Media')

    @classmethod
    def find_by_user_id(cls, user_id):
        return cls.query.filter_by(user_id=user_id, is_deleted=False).first()
