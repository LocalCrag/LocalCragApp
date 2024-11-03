import uuid

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy_utils import generic_relationship

from extensions import db
from models.area import Area
from models.line import Line
from models.sector import Sector


class Tag(db.Model):

    __tablename__ = "tags"

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    object_type = db.Column(db.Unicode(255))
    object_id = db.Column(UUID())
    object = generic_relationship(object_type, object_id)


def get_child_tags(tag: Tag):
    """
    For tags that are associated with an Area, Sector, or Crag, this function returns all tags that are associated with
    the child objects of the Area, Sector, or Crag. For example, if a tag is associated with a Crag, this function will
    return all tags that are associated with the Sectors, Areas, and Lines that belong to the Crag.
    """

    if tag.object_type == "Area":
        # Query for Area tags
        return (
            Tag.query.join(Line, Tag.object_id == Line.id)
            .filter(Tag.object_type == "Line", Line.area_id == tag.object_id)
            .all()
        )

    if tag.object_type == "Sector":
        # Query for Area tags
        area_tags = Tag.query.join(Area, Tag.object_id == Area.id).filter(
            Tag.object_type == "Area", Area.sector_id == tag.object_id
        )

        # Query for Line tags that belong to each Area
        line_tags = (
            Tag.query.join(Line, Tag.object_id == Line.id)
            .join(Area, Line.area_id == Area.id)
            .filter(Tag.object_type == "Line", Area.sector_id == tag.object_id)
        )

        # Combine the results using union_all
        all_tags = area_tags.union_all(line_tags).all()
        return all_tags

    if tag.object_type == "Crag":
        # Query for Sector tags
        sector_tags = Tag.query.join(Sector, Tag.object_id == Sector.id).filter(
            Tag.object_type == "Sector", Sector.crag_id == tag.object_id
        )

        # Query for Area tags that belong to each Sector
        area_tags = (
            Tag.query.join(Area, Tag.object_id == Area.id)
            .join(Sector, Area.sector_id == Sector.id)
            .filter(Tag.object_type == "Area", Sector.crag_id == tag.object_id)
        )

        # Query for Line tags that belong to each Area
        line_tags = (
            Tag.query.join(Line, Tag.object_id == Line.id)
            .join(Area, Line.area_id == Area.id)
            .join(Sector, Area.sector_id == Sector.id)
            .filter(Tag.object_type == "Line", Sector.crag_id == tag.object_id)
        )

        # Combine the results using union_all
        all_tags = sector_tags.union_all(area_tags).union_all(line_tags).all()
        return all_tags

    return []
