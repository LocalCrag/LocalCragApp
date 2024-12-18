from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from models.enums.line_type_enum import LineTypeEnum


class ScaleSchema(ma.SQLAlchemySchema):
    name = fields.String()
    type = EnumField(LineTypeEnum, by_value=True)
    grades = fields.List(fields.Dict)
    gradeBrackets = fields.List(fields.Integer, attribute="grade_brackets")


scale_schema = ScaleSchema()
scales_schema = ScaleSchema(many=True)
