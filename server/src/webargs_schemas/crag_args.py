from flask_marshmallow import Schema
from marshmallow import validate
from webargs import fields

from util.validators import condicaster_crag_id_validator
from webargs_schemas.closure_schedule_args import closure_schedules_field
from webargs_schemas.map_marker_args import map_marker_args


class CragArgsSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(max=120))
    description = fields.Str(required=True, allow_none=True)
    shortDescription = fields.Str(required=True, allow_none=True)
    rules = fields.Str(required=True, allow_none=True)
    rulesTitle = fields.Str(required=True, allow_none=True, validate=validate.Length(max=255))
    portraitImage = fields.String(required=True, allow_none=True)
    secret = fields.Boolean(required=True, allow_none=False)
    mapMarkers = fields.List(fields.Nested(map_marker_args), required=True, allow_none=False)
    condicasterCragId = fields.Int(required=True, allow_none=True, validate=condicaster_crag_id_validator)
    condicasterCragName = fields.Str(
        required=False, allow_none=True, load_default=None, validate=validate.Length(max=255)
    )
    closureSchedules = closure_schedules_field


crag_args = CragArgsSchema()
