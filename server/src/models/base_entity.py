import datetime

from flask import g, current_app
from sqlalchemy import func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import declared_attr

from enums.entity_types import EntityTypeEnum
from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from filters.access_level_filters import check_view_access_level
from messages.messages import ResponseMessage
from models.entity_instance import EntityInstance


class BaseEntity(db.Model):
    """
    Model of a basic entity that is extended by other entities.
    """
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True)
    time_created = db.Column(db.DateTime(), default=datetime.datetime.utcnow)
    time_updated = db.Column(db.DateTime(), onupdate=datetime.datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False, nullable=False)
    is_immutable = db.Column(db.Boolean, server_default='false', nullable=False)  # Entity not deletable nor editable
    is_locked = db.Column(db.Boolean, server_default='false', nullable=False)  # Entity not editable

    @hybrid_property
    def is_editable(self):
        """
        Sets a flag for determining of the entity can be edited by the calling user.
        The boolean permission decorator will set update_access_level which is then compared to the entities
        access level.
        :return: True if editable.
        """
        if self.is_immutable or self.is_locked:
            return False
        if not self.entity_instance.min_access_level:
            return True
        if hasattr(g, 'update_access_level'):
            return g.update_access_level.order_id <= self.entity_instance.min_access_level.order_id
        return False  # pragma: no cover

    @hybrid_property
    def is_deletable(self):
        """
        Sets a flag for determining of the entity can be edited by the calling user.
        The boolean permission decorator will set delete_access_level which is then compared to the entities
        access level.
        :return: True if editable.
        """
        if self.is_immutable:
            return False
        if not self.entity_instance.min_access_level:
            return True
        if hasattr(g, 'delete_access_level'):
            return g.delete_access_level.order_id <= self.entity_instance.min_access_level.order_id
        return False  # pragma: no cover

    def __init__(self, entity_type: EntityTypeEnum):
        self.entity_instance = EntityInstance()
        self.entity_instance.type_id = current_app.entity_types[entity_type.value].id

    @declared_attr
    def created_by_id(self):
        return db.Column(db.Integer, db.ForeignKey('users.id'))

    @declared_attr
    def created_by(self):
        return db.relationship('User', foreign_keys='[%s.created_by_id]' % self.__name__)

    @declared_attr
    def entity_instance_id(self):
        return db.Column(db.Integer, db.ForeignKey('entity_instances.id'))

    @declared_attr
    def entity_instance(self):
        return db.relationship('EntityInstance', lazy='joined')

    @classmethod
    def return_all(cls, check_view_access_level_activated=True, include_deleted=False, order_by=None, options=None):
        query = cls.query
        if options:
            query = query.options(options)
        if order_by is not None:
            query = query.order_by(order_by())
        else:
            query = query.order_by(cls.id)
        if not include_deleted:
            query = query.filter_by(is_deleted=False)
        if check_view_access_level_activated:
            query = check_view_access_level(query)
        return query.all()

    @classmethod
    def find_by_id(cls, entity_id, skip_permission_checks=False, include_deleted=False):
        query = cls.query.filter_by(id=entity_id)
        if not include_deleted:
            query = query.filter_by(is_deleted=False)
        if not skip_permission_checks:
            query = check_view_access_level(query)
        entity = query.first()

        if not entity:
            raise NotFound()

        return entity

    @classmethod
    def find_by_entity_instance_id(cls, entity_instance_id):
        return cls.query.filter_by(entity_instance_id=entity_instance_id, is_deleted=False).first()

    def persist(self):
        db.session.add(self)
        db.session.commit()

    def add_to_session(self):
        if self.is_locked:
            raise BadRequest(ResponseMessage.CANNOT_MODIFY_LOCKED_OBJECTS.value)
        if self.is_immutable:
            raise BadRequest(ResponseMessage.CANNOT_MODIFY_OR_DELETE_IMMUTABLE_OBJECTS.value)
        db.session.add(self)

    def delete(self):
        if self.is_immutable:
            raise BadRequest(ResponseMessage.CANNOT_MODIFY_OR_DELETE_IMMUTABLE_OBJECTS.value)
        self.is_deleted = True
