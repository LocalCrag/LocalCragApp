from sqlalchemy import and_
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.event import listens_for
from sqlalchemy.orm import Session
from sqlalchemy_utils import generic_relationship

from extensions import db
from models.area import Area
from models.base_entity import BaseEntity
from models.crag import Crag
from models.line import Line
from models.sector import Sector


class ModeratorTask(BaseEntity):
    __tablename__ = "moderator_tasks"

    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    completed = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    time_finished = db.Column(db.DateTime(), nullable=True)
    assigned_to_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_to = db.relationship("User", foreign_keys=[assigned_to_id])
    finished_by_id = db.Column(UUID(), db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    finished_by = db.relationship("User", foreign_keys=[finished_by_id])

    object_type = db.Column(db.Unicode(255), nullable=False)
    object_id = db.Column(UUID(), nullable=False)
    object = generic_relationship(object_type, object_id)


@listens_for(Line, "before_delete")
def cascade_delete_line_moderator_tasks(mapper, connection, target):
    session = Session.object_session(target)
    session.query(ModeratorTask).filter(
        and_(ModeratorTask.object_id == target.id, ModeratorTask.object_type == "Line")
    ).delete()


@listens_for(Area, "before_delete")
def cascade_delete_area_moderator_tasks(mapper, connection, target):
    session = Session.object_session(target)
    session.query(ModeratorTask).filter(
        and_(ModeratorTask.object_id == target.id, ModeratorTask.object_type == "Area")
    ).delete()


@listens_for(Sector, "before_delete")
def cascade_delete_sector_moderator_tasks(mapper, connection, target):
    session = Session.object_session(target)
    session.query(ModeratorTask).filter(
        and_(ModeratorTask.object_id == target.id, ModeratorTask.object_type == "Sector")
    ).delete()


@listens_for(Crag, "before_delete")
def cascade_delete_crag_moderator_tasks(mapper, connection, target):
    session = Session.object_session(target)
    session.query(ModeratorTask).filter(
        and_(ModeratorTask.object_id == target.id, ModeratorTask.object_type == "Crag")
    ).delete()
