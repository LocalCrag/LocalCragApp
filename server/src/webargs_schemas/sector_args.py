from marshmallow import Schema, validate
from webargs import fields

from util.validators import blocweather_url_validator
from webargs_schemas.closure_schedule_args import closure_schedules_field
from webargs_schemas.map_marker_args import map_marker_args


class SectorArgsSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(max=120))
    description = fields.Str(required=True, allow_none=True)
    shortDescription = fields.Str(required=True, allow_none=True)
    portraitImage = fields.String(required=True, allow_none=True)
    rules = fields.Str(required=True, allow_none=True)
    secret = fields.Boolean(required=True, allow_none=False)
    mapMarkers = fields.List(fields.Nested(map_marker_args), required=True, allow_none=False)
    defaultBoulderScale = fields.Str(required=True, allow_none=True, validate=validate.Length(max=32))
    defaultSportScale = fields.Str(required=True, allow_none=True, validate=validate.Length(max=32))
    defaultTradScale = fields.Str(required=True, allow_none=True, validate=validate.Length(max=32))
    blocweatherUrl = fields.Str(required=True, allow_none=True, validate=blocweather_url_validator)
    closureSchedules = closure_schedules_field


sector_args = SectorArgsSchema()
