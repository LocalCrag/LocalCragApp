import datetime

from webargs import fields

from models.enums.line_type_enum import LineTypeEnum

line_args = {
    "name": fields.Str(required=True),
    "description": fields.Str(required=True, allow_none=True),
    "video": fields.Str(required=True, allow_none=True),
    "gradeName": fields.Str(required=True, allow_none=False),
    "gradeScale": fields.Str(required=True, allow_none=False),
    "type": fields.Enum(LineTypeEnum, required=True, allow_none=False),
    "rating": fields.Integer(required=True, allow_none=False),
    "faYear": fields.Integer(required=True, allow_none=True, validate=lambda x: 1900 <= x <= datetime.date.today().year),
    "faName": fields.Str(required=True, allow_none=True),

    "sitstart": fields.Boolean(required=True, allow_none=False),
    "eliminate": fields.Boolean(required=True, allow_none=False),
    "traverse": fields.Boolean(required=True, allow_none=False),
    "highball": fields.Boolean(required=True, allow_none=False),
    "noTopout": fields.Boolean(required=True, allow_none=False),

    "roof": fields.Boolean(required=True, allow_none=False),
    "slab": fields.Boolean(required=True, allow_none=False),
    "vertical": fields.Boolean(required=True, allow_none=False),
    "overhang": fields.Boolean(required=True, allow_none=False),

    "athletic": fields.Boolean(required=True, allow_none=False),
    "technical": fields.Boolean(required=True, allow_none=False),
    "endurance": fields.Boolean(required=True, allow_none=False),
    "cruxy": fields.Boolean(required=True, allow_none=False),
    "dyno": fields.Boolean(required=True, allow_none=False),

    "jugs": fields.Boolean(required=True, allow_none=False),
    "sloper": fields.Boolean(required=True, allow_none=False),
    "crimps": fields.Boolean(required=True, allow_none=False),
    "pockets": fields.Boolean(required=True, allow_none=False),
    "pinches": fields.Boolean(required=True, allow_none=False),

    "crack": fields.Boolean(required=True, allow_none=False),
    "dihedral": fields.Boolean(required=True, allow_none=False),
    "compression": fields.Boolean(required=True, allow_none=False),
    "arete": fields.Boolean(required=True, allow_none=False),

}
