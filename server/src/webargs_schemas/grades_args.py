from webargs import fields

from models.enums.line_type_enum import LineTypeEnum

grades_spec_args = {
    "name": fields.Str(required=True, allow_none=False),
    "value": fields.Integer(required=True, allow_none=False),
}

grades_args = {
    "name": fields.String(required=False),
    "type": fields.Enum(LineTypeEnum, required=True, allow_none=False),
    "grades": fields.List(
        fields.Nested(grades_spec_args),
        required=True,
        allow_none=False,
        validate=lambda gs: len(gs) == len(set([g["name"] for g in gs])),  # Grade names must be unique
    ),
}
