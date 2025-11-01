from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.event import listens_for
from sqlalchemy.orm import Session
from sqlalchemy_utils import generic_relationship

from extensions import db
from models.area import Area
from models.base_entity import BaseEntity
from models.crag import Crag
from models.line import Line
from models.post import Post
from models.region import Region
from models.sector import Sector


class Comment(BaseEntity):
    __tablename__ = "comments"

    message = db.Column(db.Text, nullable=False)

    # Generic relationship to Line, Area, Sector, Crag, Region, Post, etc.
    object_type = db.Column(db.Unicode(255))
    object_id = db.Column(UUID())
    object = generic_relationship(object_type, object_id)

    # Self-referential for replies
    parent_id = db.Column(UUID(), db.ForeignKey("comments.id"), nullable=True)
    parent = db.relationship(
        "Comment",
        remote_side="Comment.id",
        backref=db.backref("replies", cascade="all,delete", lazy="select"),
        lazy="select",
    )


# Cascade deletions when the related object is deleted
@listens_for(Line, "before_delete")
def cascade_delete_line_comments(mapper, connection, target):
    session = Session.object_session(target)
    session.query(Comment).filter(Comment.object_id == target.id, Comment.object_type == "Line").delete()


@listens_for(Area, "before_delete")
def cascade_delete_area_comments(mapper, connection, target):
    session = Session.object_session(target)
    session.query(Comment).filter(Comment.object_id == target.id, Comment.object_type == "Area").delete()


@listens_for(Sector, "before_delete")
def cascade_delete_sector_comments(mapper, connection, target):
    session = Session.object_session(target)
    session.query(Comment).filter(Comment.object_id == target.id, Comment.object_type == "Sector").delete()


@listens_for(Crag, "before_delete")
def cascade_delete_crag_comments(mapper, connection, target):
    session = Session.object_session(target)
    session.query(Comment).filter(Comment.object_id == target.id, Comment.object_type == "Crag").delete()


@listens_for(Region, "before_delete")
def cascade_delete_region_comments(mapper, connection, target):
    session = Session.object_session(target)
    session.query(Comment).filter(Comment.object_id == target.id, Comment.object_type == "Region").delete()


@listens_for(Post, "before_delete")
def cascade_delete_post_comments(mapper, connection, target):
    session = Session.object_session(target)
    session.query(Comment).filter(Comment.object_id == target.id, Comment.object_type == "Post").delete()
