from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.search_schema import LineSearchSchema, AreaSearchSchema, SectorSearchSchema, CragSearchSchema
from models.area import Area
from models.crag import Crag
from models.enums.history_item_type_enum import HistoryItemTypeEnum
from models.line import Line
from models.sector import Sector


class GenericRelatedHistoryField(fields.Field):
    def _serialize(self, value, attr, obj, **kwargs):
        if isinstance(value, Line):
            return LineSearchSchema().dump(value)
        if isinstance(value, Area):
            return AreaSearchSchema().dump(value)
        if isinstance(value, Sector):
            return SectorSearchSchema().dump(value)
        if isinstance(value, Crag):
            return CragSearchSchema().dump(value)
        else:
            return None


class HistorySchema(BaseEntitySchema):
    type = EnumField(HistoryItemTypeEnum)
    object = GenericRelatedHistoryField(attribute="object")
    objectType = fields.String(attribute="object_type")
    oldValue = fields.String(attribute="old_value")
    newValue = fields.String(attribute="new_value")
    propertyName = fields.String(attribute="property_name")


class PaginatedHistorySchema(ma.SQLAlchemySchema):
    items = fields.List(fields.Nested(HistorySchema()))
    hasNext = fields.Boolean(attribute="has_next")


paginated_history_schema = PaginatedHistorySchema()
