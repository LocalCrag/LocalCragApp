from passlib.hash import pbkdf2_sha256
from sqlalchemy.dialects.postgresql import UUID
from extensions import db
from models.base_entity import BaseEntity
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.mixins.has_slug import HasSlug
from models.mixins.is_searchable import IsSearchable


class User(HasSlug, IsSearchable, BaseEntity):
    """
    Model of a user.
    """
    __tablename__ = 'users'
    slug_target_columns = 'firstname, lastname'
    search_name_target_columns = ['firstname', 'lastname']
    searchable_type = SearchableItemTypeEnum.USER
    test = None

    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    new_email = db.Column(db.String(120), nullable=True, unique=True)
    new_email_hash = db.Column(db.String(120), nullable=True, default=None)
    new_email_hash_created = db.Column(db.DateTime(timezone=True), default=None, nullable=True)
    firstname = db.Column(db.String(120), nullable=True)
    lastname = db.Column(db.String(120), nullable=True)
    activated = db.Column(db.Boolean, default=False)
    activated_at = db.Column(db.DateTime(), nullable=True)
    reset_password_hash = db.Column(db.String(120), nullable=True, default=None)
    reset_password_hash_created = db.Column(db.DateTime(timezone=True), default=None, nullable=True)
    language = db.Column(db.String, nullable=False, server_default='de')
    avatar_id = db.Column(UUID(), db.ForeignKey('files.id'), nullable=True)
    avatar = db.relationship('File', foreign_keys=avatar_id)
    superadmin = db.Column(db.Boolean, nullable=False, default=False, server_default='0')
    admin = db.Column(db.Boolean, nullable=False, default=False, server_default='0')
    moderator = db.Column(db.Boolean, nullable=False, default=False, server_default='0')
    member = db.Column(db.Boolean, nullable=False, default=False, server_default='0')
    ascents = db.relationship("Ascent", cascade="all,delete", lazy="select", overlaps="created_by")
    rankings = db.relationship("Ranking", cascade="all,delete", lazy="select")

    @staticmethod
    def generate_hash(password):
        return pbkdf2_sha256.hash(password)

    @staticmethod
    def verify_hash(password, password_hash):
        return pbkdf2_sha256.verify(password, password_hash)

    @classmethod
    def find_by_reset_password_hash(cls, password_hash):
        return cls.query.filter_by(reset_password_hash=password_hash).first()

    @classmethod
    def find_by_new_email_hash(cls, new_email_hash):
        return cls.query.filter_by(new_email_hash=new_email_hash).first()

    @classmethod
    def find_by_email(cls, email):
        user = cls.query.filter_by(email=email).first()
        return user

    @classmethod
    def get_admins(cls):
        return cls.query.filter_by(admin=True)

    @classmethod
    def get_user_count(cls):
        return cls.query.count()
