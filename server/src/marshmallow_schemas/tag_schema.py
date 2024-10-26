from marshmallow import fields

from extensions import ma
from marshmallow_schemas.line_schema import  LineSchemaMin
from marshmallow_schemas.search_schema import AreaSearchSchema, SectorSearchSchema, CragSearchSchema
from marshmallow_schemas.user_schema import UserMinSchema
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from models.user import User


class GenericRelatedTagField(fields.Field):
    def _serialize(self, value, attr, obj, **kwargs):
        if isinstance(value, User):
            return UserMinSchema().dump(value)
        if isinstance(value, Line):
            return LineSchemaMin().dump(value)
        if isinstance(value, Area):
            return AreaSearchSchema().dump(value)
        if isinstance(value, Sector):
            return SectorSearchSchema().dump(value)
        if isinstance(value, Crag):
            return CragSearchSchema().dump(value)
        else:
            return None


class TagSchema(ma.SQLAlchemySchema):
    object = GenericRelatedTagField(attribute="object")
    object_type = fields.String(attribute="object_type")


tag_schema = TagSchema(many=True)
