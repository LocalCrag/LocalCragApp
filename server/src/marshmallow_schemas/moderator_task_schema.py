from marshmallow import fields

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.search_schema import (
    area_search_schema,
    crag_search_schema,
    line_search_schema,
    sector_search_schema,
)
from marshmallow_schemas.user_schema import UserMinWithAvatarSchema
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.region import Region
from models.sector import Sector


class RegionMinSchema(ma.SQLAlchemySchema):
    id = fields.String()
    name = fields.String()


region_min_schema = RegionMinSchema()


class GenericRelatedModeratorTaskField(fields.Field):
    def _serialize(self, value, attr, obj, **kwargs):
        if isinstance(value, Line):
            return line_search_schema.dump(value)
        if isinstance(value, Area):
            return area_search_schema.dump(value)
        if isinstance(value, Sector):
            return sector_search_schema.dump(value)
        if isinstance(value, Crag):
            return crag_search_schema.dump(value)
        if isinstance(value, Region):
            return region_min_schema.dump(value)
        return None


class ModeratorTaskSchema(BaseEntitySchema):
    title = fields.String()
    description = fields.String()
    completed = fields.Boolean()
    timeFinished = fields.DateTime(attribute="time_finished", allow_none=True)
    assignedTo = fields.Nested(UserMinWithAvatarSchema, attribute="assigned_to", allow_none=True)
    finishedBy = fields.Nested(UserMinWithAvatarSchema, attribute="finished_by", allow_none=True)
    objectType = fields.String(attribute="object_type")
    objectId = fields.String(attribute="object_id")
    object = GenericRelatedModeratorTaskField()


class PaginatedModeratorTasksSchema(ma.SQLAlchemySchema):
    items = fields.List(fields.Nested(ModeratorTaskSchema()))
    hasNext = fields.Boolean(attribute="has_next")


moderator_task_schema = ModeratorTaskSchema()
paginated_moderator_tasks_schema = PaginatedModeratorTasksSchema()
