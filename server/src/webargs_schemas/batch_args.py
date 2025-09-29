import datetime

from marshmallow import validate
from webargs import fields

from models.enums.line_type_enum import LineTypeEnum
from webargs_schemas.line_args import batch_line_args

batch_args = {
    "images": fields.List(
        fields.String(required=True, allow_none=False), required=True, validate=lambda x: len(x) >= 1
    ),
    "gradeScale": fields.Str(required=True, allow_none=False, validate=validate.Length(max=120)),
    "type": fields.Enum(LineTypeEnum, required=True, allow_none=False),
    "faDate": fields.Date(required=True, allow_none=True, validate=lambda x: datetime.date.today() >= x),
    "lines": fields.List(fields.Nested(batch_line_args)),
}
