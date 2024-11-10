from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from models.enums.line_type_enum import LineTypeEnum


class GradesSchema(ma.SQLAlchemySchema):
    name = fields.String()
    type = EnumField(LineTypeEnum, by_value=True)
    grades = fields.List(fields.Dict)


class GradesSchemaMin(ma.SQLAlchemySchema):
    name = fields.String()
    type = EnumField(LineTypeEnum, by_value=True)


grades_schema = GradesSchema()
grades_list_schema = GradesSchemaMin(many=True)
