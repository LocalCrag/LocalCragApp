from sqlalchemy.event import listens_for
from sqlalchemy.orm import Session
from sqlalchemy_utils import generic_relationship

from extensions import db
from models.area import Area
from models.base_entity import BaseEntity
from models.crag import Crag
from models.enums.history_item_type_enum import HistoryItemTypeEnum
from sqlalchemy.dialects.postgresql import UUID

from models.line import Line
from models.sector import Sector
from models.user import User


class HistoryItem(BaseEntity):
    """
    Model of a line in a sector. Can be a boulder or route.
    """

    __tablename__ = "history_items"

    type = db.Column(db.Enum(HistoryItemTypeEnum), nullable=False)
    old_value = db.Column(db.String(120), nullable=True)
    new_value = db.Column(db.String(120), nullable=True)
    property_name = db.Column(db.String(120), nullable=True)
    object_type = db.Column(db.Unicode(255))
    object_id = db.Column(UUID())
    object = generic_relationship(object_type, object_id)

    @classmethod
    def create_history_item(
        cls, item_type, target_object, user: User, old_value=None, new_value=None, property_name=None
    ):
        history_item = cls()
        history_item.created_by = user
        history_item.type = item_type
        history_item.old_value = old_value
        history_item.new_value = new_value
        history_item.object = target_object
        history_item.property_name = property_name
        db.session.add(history_item)
        db.session.commit()
        return history_item


@listens_for(Line, "before_delete")
def cascade_delete_line(mapper, connection, target):
    session = Session.object_session(target)
    session.query(HistoryItem).filter(HistoryItem.object_id == target.id, HistoryItem.object_type == "Line").delete()


@listens_for(Area, "before_delete")
def cascade_delete_area(mapper, connection, target):
    session = Session.object_session(target)
    session.query(HistoryItem).filter(HistoryItem.object_id == target.id, HistoryItem.object_type == "Area").delete()


@listens_for(Sector, "before_delete")
def cascade_delete_sector(mapper, connection, target):
    session = Session.object_session(target)
    session.query(HistoryItem).filter(HistoryItem.object_id == target.id, HistoryItem.object_type == "Sector").delete()


@listens_for(Crag, "before_delete")
def cascade_delete_crag(mapper, connection, target):
    session = Session.object_session(target)
    session.query(HistoryItem).filter(HistoryItem.object_id == target.id, HistoryItem.object_type == "Crag").delete()
