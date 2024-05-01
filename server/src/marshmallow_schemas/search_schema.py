from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from marshmallow_schemas.file_schema import file_schema_without_user
from models.enums.line_type_enum import LineTypeEnum


class CragSearchSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    portraitImage = fields.Nested(file_schema_without_user, attribute='portrait_image')


crag_search_schema = CragSearchSchema()


class SectorSearchSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    portraitImage = fields.Nested(file_schema_without_user, attribute='portrait_image')
    crag = fields.Nested(crag_search_schema)


sector_search_schema = SectorSearchSchema()


class AreaSearchSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    portraitImage = fields.Nested(file_schema_without_user, attribute='portrait_image')
    sector = fields.Nested(sector_search_schema)


area_search_schema = AreaSearchSchema()


class LineSearchSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    type = EnumField(LineTypeEnum, by_value=True)
    gradeName = fields.String(attribute='grade_name')
    gradeScale = fields.String(attribute='grade_scale')
    area = fields.Nested(area_search_schema)


line_search_schema = LineSearchSchema()


class UserSearchSchema(ma.SQLAlchemySchema):
    firstname = fields.String()
    lastname = fields.String()
    slug = fields.String()
    avatar = ma.Nested(file_schema_without_user)


user_search_schema = UserSearchSchema()
