from passlib.hash import pbkdf2_sha256 as sha256
from sqlalchemy.orm import joinedload

from enums.entity_types import EntityTypeEnum
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from filters.access_level_filters import check_view_access_level
from messages.messages import ResponseMessage
from models.base_entity import BaseEntity
from models.user2permission import User2Permission


class User(BaseEntity):
    """
    Model of a user.
    """
    __tablename__ = 'users'
    __entity_type__ = EntityTypeEnum.USER

    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    firstname = db.Column(db.String(120), nullable=True)
    lastname = db.Column(db.String(120), nullable=True)
    locked = db.Column(db.Boolean, default=False)
    activated = db.Column(db.Boolean, default=False)
    activated_at = db.Column(db.DateTime(), nullable=True)
    reset_password_hash = db.Column(db.String(120), nullable=True, default=None)
    reset_password_hash_created = db.Column(db.DateTime(timezone=True), default=None, nullable=True)
    organisation_id = db.Column(db.Integer, db.ForeignKey('organisations.id'))
    organisation = db.relationship('Organisation')
    permissions = db.relationship("UserPermission", secondary=User2Permission.__table__, viewonly=True)
    account_settings = db.relationship('AccountSettings', uselist=False, primaryjoin="User.id==AccountSettings.user_id")

    def __init__(self):
        super(User, self).__init__(self.__entity_type__)

    @staticmethod
    def generate_hash(password):
        return sha256.hash(password)

    @staticmethod
    def verify_hash(password, password_hash):
        return sha256.verify(password, password_hash)

    @classmethod
    def find_by_email(cls, email, abort_401_if_none=False):
        user = cls.query.filter_by(email=email).first()
        if not user and abort_401_if_none:
            raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
        else:
            return user

    @classmethod
    def find_by_reset_password_hash(cls, password_hash):
        return cls.query.filter_by(reset_password_hash=password_hash, is_deleted=False).first()

    @classmethod
    def find_detailed_by_id(cls, user_id):
        query = cls.query.filter_by(id=user_id, is_deleted=False)
        query = check_view_access_level(query)
        user = query.first()
        if user:
            permissions = User2Permission.return_all_permissions_for_user(user.id)
            user.permissions = permissions
        return user

    @classmethod
    def find_detailed_by_email(cls, email):
        query = cls.query.filter_by(email=email, is_deleted=False)
        query = check_view_access_level(query)
        user = query.first()
        if user:
            permissions = User2Permission.return_all_permissions_for_user(user.id)
            user.permissions = permissions
        return user

    # noinspection PyUnresolvedReferences
    @classmethod
    def find_by_identifier(cls, query, excluded_ids):
        """
        Finds a list of max 5 users by either firstname, lastname or email.
        @param query: Search query.
        @param excluded_ids: IDs of the users that should not be included in the result.
        """
        query = cls.query.filter(
            User.is_deleted == False,
            (
                    User.firstname.ilike('%{}%'.format(query)) |
                    User.lastname.ilike('%{}%'.format(query)) |
                    User.email.ilike('%{}%'.format(query))
            )
        )
        if excluded_ids:
            query = query.filter(User.id.notin_(excluded_ids))

        # Add eager loading for this to save a lot of queries
        query = query.options(
            joinedload(User.account_settings).joinedload(db.get_model('AccountSettings').avatar),
        )
        return query.limit(5).all()
