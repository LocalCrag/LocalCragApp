import uuid

from sqlalchemy import event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session
from sqlalchemy_utils import generic_relationship

from extensions import db
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector


class Tag(db.Model):
    __tablename__ = "tags"

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    object_type = db.Column(db.Unicode(255))
    object_id = db.Column(UUID())
    object = generic_relationship(object_type, object_id)
    secret = db.Column(db.Boolean, default=False, server_default="0")


@event.listens_for(Area, "after_update")
@event.listens_for(Sector, "after_update")
@event.listens_for(Crag, "after_update")
@event.listens_for(Line, "after_update")
def update_tag_secret_listener(mapper, connection, target):
    with Session(db.engine) as separate_session:
        tag = separate_session.query(Tag).filter_by(object=target).first()
        if tag:
            tag.secret = target.secret
            separate_session.add(tag)
            separate_session.commit()


def get_child_tags(tag_object_type, tag_object_id):
    """
    For tags that are associated with an Area, Sector, or Crag, this function returns all tags that are associated with
    the child objects of the Area, Sector, or Crag. For example, if a tag is associated with a Crag, this function will
    return all tags that are associated with the Sectors, Areas, and Lines that belong to the Crag.
    """

    if tag_object_type == "Area":
        # Query for Area tags
        return (
            Tag.query.join(Line, Tag.object_id == Line.id)
            .filter(Tag.object_type == "Line", Line.area_id == tag_object_id)
            .all()
        )

    if tag_object_type == "Sector":
        # Query for Area tags
        area_tags = Tag.query.join(Area, Tag.object_id == Area.id).filter(
            Tag.object_type == "Area", Area.sector_id == tag_object_id
        )

        # Query for Line tags that belong to each Area
        line_tags = (
            Tag.query.join(Line, Tag.object_id == Line.id)
            .join(Area, Line.area_id == Area.id)
            .filter(Tag.object_type == "Line", Area.sector_id == tag_object_id)
        )

        # Combine the results using union_all
        all_tags = area_tags.union_all(line_tags).all()
        return all_tags

    if tag_object_type == "Crag":
        # Query for Sector tags
        sector_tags = Tag.query.join(Sector, Tag.object_id == Sector.id).filter(
            Tag.object_type == "Sector", Sector.crag_id == tag_object_id
        )

        # Query for Area tags that belong to each Sector
        area_tags = (
            Tag.query.join(Area, Tag.object_id == Area.id)
            .join(Sector, Area.sector_id == Sector.id)
            .filter(Tag.object_type == "Area", Sector.crag_id == tag_object_id)
        )

        # Query for Line tags that belong to each Area
        line_tags = (
            Tag.query.join(Line, Tag.object_id == Line.id)
            .join(Area, Line.area_id == Area.id)
            .join(Sector, Area.sector_id == Sector.id)
            .filter(Tag.object_type == "Line", Sector.crag_id == tag_object_id)
        )

        # Combine the results using union_all
        all_tags = sector_tags.union_all(area_tags).union_all(line_tags).all()
        return all_tags

    return []
