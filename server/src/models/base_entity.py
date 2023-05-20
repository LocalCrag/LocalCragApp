import datetime
import uuid

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declared_attr

from error_handling.http_exceptions.not_found import NotFound
from extensions import db


class BaseEntity(db.Model):
    """
    Model of a basic entity that is extended by other entities.
    """
    __abstract__ = True

    id = db.Column(UUID(), default=lambda u: str(uuid.uuid4()), unique=True, primary_key=True)

    time_created = db.Column(db.DateTime(), default=datetime.datetime.utcnow)
    time_updated = db.Column(db.DateTime(), onupdate=datetime.datetime.utcnow)

    @declared_attr
    def created_by_id(self):
        return db.Column(UUID(), db.ForeignKey('users.id'))

    @declared_attr
    def created_by(self):
        return db.relationship('User', foreign_keys='[%s.created_by_id]' % self.__name__)

    @classmethod
    def return_all(cls, order_by=None, options=None, filter=None):
        query = cls.query
        if options:
            query = query.options(options)
        if filter:
            query = query.filter(filter())
        if order_by is not None:
            query = query.order_by(order_by())
        else:
            query = query.order_by(cls.id)
        return query.all()

    @classmethod
    def find_by_id(cls, id):
        entity = cls.query.filter_by(id=id).first()

        if not entity:
            raise NotFound()

        return entity

    @classmethod
    def find_by_slug(cls, slug):
        entity = cls.query.filter_by(slug=slug).first()

        if not entity:
            raise NotFound()

        return entity

