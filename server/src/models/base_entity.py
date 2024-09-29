import datetime
import uuid
from typing import Self

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declared_attr

from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from util.secret_spots_auth import get_show_secret


class BaseEntity(db.Model):
    """
    Model of a basic entity that is extended by other entities.
    """

    __abstract__ = True

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)

    time_created = db.Column(db.DateTime(), default=datetime.datetime.utcnow)
    time_updated = db.Column(db.DateTime(), onupdate=datetime.datetime.utcnow)

    @declared_attr
    def created_by_id(self):
        return db.Column(UUID(), db.ForeignKey("users.id", ondelete="SET NULL"))

    @declared_attr
    def created_by(self):
        return db.relationship("User", foreign_keys="[%s.created_by_id]" % self.__name__)

    @classmethod
    def return_all(cls, order_by=None, options=None, filter=None) -> list[Self]:
        query = cls.query
        if options:
            query = query.options(options)
        if filter:
            query = query.filter(filter())
        if order_by is not None:
            if not type(order_by) is list:
                order_by = [order_by]
            for ob in order_by:
                query = query.order_by(ob())
        else:
            query = query.order_by(cls.id)
        # Check if a model has the secret spot property, if yes add a filter based on view rights
        if hasattr(cls, "secret"):
            if not get_show_secret():
                query = query.filter(cls.secret.is_(False))
        return query.all()

    @classmethod
    def find_by_id(cls, id) -> Self:
        entity = cls.query.filter_by(id=id).first()

        if not entity:
            raise NotFound()

        return entity

    @classmethod
    def find_by_slug(cls, slug) -> Self:
        entity = cls.query.filter_by(slug=slug).first()

        if not entity:
            raise NotFound()

        return entity

    @classmethod
    def get_id_by_slug(cls, slug):
        id = db.session.query(cls.id).filter_by(slug=slug).first()

        if not id:
            raise NotFound()

        return id[0]
