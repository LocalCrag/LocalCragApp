from marshmallow import fields

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.post_schema import PostSearchSchema
from marshmallow_schemas.search_schema import (
    AreaSearchSchema,
    CragSearchSchema,
    LineSearchSchema,
    SectorSearchSchema,
)
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.post import Post
from models.sector import Sector


class GenericRelatedCommentField(fields.Field):
    def _serialize(self, value, attr, obj, **kwargs):
        if isinstance(value, Line):
            return LineSearchSchema().dump(value)
        if isinstance(value, Area):
            return AreaSearchSchema().dump(value)
        if isinstance(value, Sector):
            return SectorSearchSchema().dump(value)
        if isinstance(value, Crag):
            return CragSearchSchema().dump(value)
        if isinstance(value, Post):
            return PostSearchSchema().dump(value)
        else:
            return None


class CommentSchema(BaseEntitySchema):
    message = fields.String()
    object = GenericRelatedCommentField(attribute="object")
    objectType = fields.String(attribute="object_type")
    parentId = fields.String(attribute="parent_id")


class PaginatedCommentsSchema(ma.SQLAlchemySchema):
    items = fields.List(fields.Nested(CommentSchema()))
    hasNext = fields.Boolean(attribute="has_next")


comment_schema = CommentSchema()
paginated_comments_schema = PaginatedCommentsSchema()
