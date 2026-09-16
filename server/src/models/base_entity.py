import datetime
import uuid
from typing import Self

import pytz
from sqlalchemy import event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declared_attr

from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from util.secret_service import SecretService


class BaseEntity(db.Model):
    """
    Model of a basic entity that is extended by other entities.
    """

    __abstract__ = True

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)

    time_created = db.Column(db.DateTime(), default=lambda: datetime.datetime.now(pytz.utc))
    time_updated = db.Column(db.DateTime(), onupdate=lambda: datetime.datetime.now(pytz.utc))

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
            f = filter()
            if isinstance(f, list):
                query = query.filter(*f)
            else:
                query = query.filter(f)
        if order_by is not None:
            if not type(order_by) is list:
                order_by = [order_by]
            for ob in order_by:
                query = query.order_by(ob())
        else:
            query = query.order_by(cls.id)
        # Check if a model has the secret spot property, if yes add a filter based on view rights
        if hasattr(cls, "secret"):
            query = SecretService.apply_topo_entity_filter(query, cls)
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


def _request_user_if_available():
    """
    Return the already-loaded request user, or None outside a request / session.
    """
    from flask import has_request_context

    if not has_request_context():
        return None

    from util.auth_session import get_current_user

    return get_current_user()


@event.listens_for(db.session, "before_flush")
def set_created_by_ids(session, _flush_context, _instances):
    """
    Sets created_by on new BaseEntity rows from the authenticated request user.

    Skips rows that already have created_by_id so fixtures, helpers, and cases
    where the user was loaded and assigned previously are not overwritten.
    """
    new_items = [item for item in session.new if isinstance(item, BaseEntity)]
    if not new_items:
        return

    user = _request_user_if_available()
    if user is None:
        return

    for item in new_items:
        if item.created_by_id is not None:
            continue
        # Set the FK, not the relationship: User.created_by is self-referential
        # and is not a scalar many-to-one.
        item.created_by_id = user.id
