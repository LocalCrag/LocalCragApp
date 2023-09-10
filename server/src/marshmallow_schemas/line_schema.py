from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from models.enums.line_type_enum import LineTypeEnum
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class LineSchema(BaseEntitySchema):
    name = fields.String()
    description = fields.String()
    slug = fields.String()
    video = fields.String()
    type = EnumField(LineTypeEnum, by_value=True)
    rating = fields.Integer()
    grade = fields.Integer()
    linepath = fields.Dict()
    faYear: fields.Integer(attribute='fa_year')
    faName: fields.String(attribute='fa_name')

    sitstart = fields.Boolean()
    eliminate = fields.Boolean()
    traverse = fields.Boolean()
    highball = fields.Boolean()
    noTopout = fields.Boolean(attribute='no_topout')

    roof = fields.Boolean()
    slab = fields.Boolean()
    vertical = fields.Boolean()
    overhang = fields.Boolean()

    athletic = fields.Boolean()
    technical = fields.Boolean()
    endurance = fields.Boolean()
    cruxy = fields.Boolean()
    dyno = fields.Boolean()

    jugs = fields.Boolean()
    sloper = fields.Boolean()
    crimpy = fields.Boolean()
    pockets = fields.Boolean()

    crack = fields.Boolean()
    dihedral = fields.Boolean()
    compression = fields.Boolean()
    arete = fields.Boolean()
    wall = fields.Boolean()


line_schema = LineSchema()
lines_schema = LineSchema(many=True)
