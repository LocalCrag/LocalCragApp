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
    parentId = fields.String(attribute="parent_id")
    rootId = fields.String(attribute="root_id")
    isDeleted = fields.Boolean(attribute="is_deleted")


class CommentWithRepliesSchema(CommentSchema):
    replyCount = fields.Method("get_reply_count")

    def get_reply_count(self, obj):
        # Use dynamic placeholder attribute if present
        if hasattr(obj, "_reply_count"):
            return getattr(obj, "_reply_count")
        return len(getattr(obj, "replies", []) or [])


class PaginatedCommentsSchema(ma.SQLAlchemySchema):
    items = fields.List(fields.Nested(CommentSchema()))
    hasNext = fields.Boolean(attribute="has_next")


class PaginatedCommentsWithRepliesSchema(ma.SQLAlchemySchema):
    items = fields.List(fields.Nested(CommentWithRepliesSchema()))
    hasNext = fields.Boolean(attribute="has_next")


comment_schema = CommentSchema()
paginated_comments_schema = PaginatedCommentsSchema()
paginated_comments_with_replies_schema = PaginatedCommentsWithRepliesSchema()
