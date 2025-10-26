from marshmallow import validate
from webargs import fields

from models.enums.line_type_enum import LineTypeEnum
from webargs_schemas.line_args import batch_line_args, validate_fa_date

batch_args = {
    "images": fields.List(
        fields.String(required=True, allow_none=False), required=True, validate=validate.Length(min=1)
    ),
    "gradeScale": fields.Str(required=True, allow_none=False, validate=validate.Length(max=120)),
    "type": fields.Enum(LineTypeEnum, required=True, allow_none=False),
    "faDate": fields.Date(required=True, allow_none=True, validate=validate_fa_date),
    "lines": fields.List(fields.Nested(batch_line_args)),
}
