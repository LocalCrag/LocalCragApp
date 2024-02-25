import datetime

import validators
from webargs import fields

from models.enums.line_type_enum import LineTypeEnum
from models.enums.starting_position_enum import StartingPositionEnum

videos_args = {
    "url": fields.Str(required=True, allow_none=False, validate=lambda x: validators.url(x) == True),
    "title": fields.Str(required=True, allow_none=False),
}

line_args = {
    "name": fields.Str(required=True),
    "description": fields.Str(required=True, allow_none=True),
    "videos": fields.List(fields.Nested(videos_args),  required=True, allow_none=True),
    "gradeName": fields.Str(required=True, allow_none=False),
    "gradeScale": fields.Str(required=True, allow_none=False),
    "type": fields.Enum(LineTypeEnum, required=True, allow_none=False),
    "rating": fields.Integer(required=True, allow_none=True, validate=lambda x: 1 <= x <= 5 or x is None),
    "faYear": fields.Integer(required=True, allow_none=True, validate=lambda x: 1900 <= x <= datetime.date.today().year),
    "faName": fields.Str(required=True, allow_none=True),
    "startingPosition": fields.Enum(StartingPositionEnum, required=True, allow_none=False),

    "eliminate": fields.Boolean(required=True, allow_none=False),
    "traverse": fields.Boolean(required=True, allow_none=False),
    "highball": fields.Boolean(required=True, allow_none=False),
    "lowball": fields.Boolean(required=True, allow_none=False),
    "noTopout": fields.Boolean(required=True, allow_none=False),
    "badDropzone": fields.Boolean(required=True, allow_none=False),

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
    "mantle": fields.Boolean(required=True, allow_none=False),
}
