from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from marshmallow_schemas.file_schema import file_schema
from models.enums.line_type_enum import LineTypeEnum


class CragSearchSchema(ma.SQLAlchemySchema):
    id = fields.String()
    name = fields.String()
    slug = fields.String()
    portraitImage = fields.Nested(file_schema, attribute="portrait_image")


crag_search_schema = CragSearchSchema()


class SectorSearchSchema(ma.SQLAlchemySchema):
    id = fields.String()
    name = fields.String()
    slug = fields.String()
    portraitImage = fields.Nested(file_schema, attribute="portrait_image")
    crag = fields.Nested(crag_search_schema)


sector_search_schema = SectorSearchSchema()


class AreaSearchSchema(ma.SQLAlchemySchema):
    id = fields.String()
    name = fields.String()
    slug = fields.String()
    portraitImage = fields.Nested(file_schema, attribute="portrait_image")
    sector = fields.Nested(sector_search_schema)


area_search_schema = AreaSearchSchema()


class LineSearchSchema(ma.SQLAlchemySchema):
    id = fields.String()
    name = fields.String()
    slug = fields.String()
    type = EnumField(LineTypeEnum, by_value=True)
    gradeName = fields.String(attribute="grade_name")
    gradeScale = fields.String(attribute="grade_scale")
    area = fields.Nested(area_search_schema)


line_search_schema = LineSearchSchema()


class UserSearchSchema(ma.SQLAlchemySchema):
    id = fields.String()
    firstname = fields.String()
    lastname = fields.String()
    slug = fields.String()
    avatar = ma.Nested(file_schema)


user_search_schema = UserSearchSchema()

# todo add ids in tests