from marshmallow import validate
from webargs import fields

from webargs_schemas.line_args import validate_fa_date, validate_fa_year

FA_REMOVAL_MESSAGE_MAX_LENGTH = 2000

ticks_args = {
    "user": fields.String(required=False),
    "area": fields.String(required=False),
    "sector": fields.String(required=False),
    "crag": fields.String(required=False),
}

ascent_args = {
    "line": fields.String(required=True, allow_none=False),
    "flash": fields.Boolean(required=True),
    "fa": fields.Boolean(required=True),
    "withKneepad": fields.Boolean(required=True),
    "soft": fields.Boolean(required=True),
    "hard": fields.Boolean(required=True),
    "gradeValue": fields.Integer(required=True),
    "rating": fields.Integer(required=True, allow_none=True),
    "comment": fields.Str(required=True, allow_none=True),
    "year": fields.Integer(required=True, allow_none=True, validate=validate_fa_year),
    "date": fields.Date(
        required=True,
        allow_none=True,
        format="iso8601",
        validate=validate_fa_date,
    ),
}

project_climbed_args = {
    "line": fields.String(required=True, allow_none=False),
    "message": fields.String(required=True, allow_none=False),
}

clear_ascent_fa_args = {
    "message": fields.Str(
        required=False,
        allow_none=True,
        load_default=None,
        validate=validate.Length(max=FA_REMOVAL_MESSAGE_MAX_LENGTH),
    ),
}


def cross_validate_ascent_args(args):
    if args["soft"] and args["hard"]:
        return False
    if args["year"] and args["date"]:
        return False
    return True
