import datetime

import validators
from marshmallow import Schema, ValidationError, validate
from webargs import fields

from models.enums.line_type_enum import LineTypeEnum
from models.enums.starting_position_enum import StartingPositionEnum
from util.validators import color_validator
from webargs_schemas.mixins.is_closable import IsClosableWebargsMixin


def validate_fa_year(year: int):
    current_year = datetime.date.today().year
    if not 1900 <= year <= current_year:
        raise ValidationError(f"FA year must be between 1900 and {current_year}.")


def validate_fa_date(fa_date: datetime.date):
    if fa_date > datetime.date.today():
        raise ValidationError("FA date cannot be in the future.")


def validate_video_url(url: str):
    if not validators.url(url):
        raise ValidationError(f"Invalid URL: {url}")


def validate_rating(value: int):
    if not (1 <= value <= 5):
        raise ValidationError("Rating must be between 1 and 5.")


class VideosArgsSchema(Schema):
    url = fields.Str(required=True, allow_none=False, validate=validate_video_url)
    title = fields.Str(required=True, allow_none=False)


class BatchLineArgsSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(max=120))
    color = fields.Str(required=False, allow_none=True, validate=color_validator)
    startingPosition = fields.Enum(StartingPositionEnum, required=True, allow_none=False)
    authorGradeValue = fields.Integer(required=True, allow_none=False, validate=validate.Range(min=-2))
    faName = fields.Str(required=True, allow_none=True, validate=validate.Length(max=120))


class LineArgsSchema(BatchLineArgsSchema, IsClosableWebargsMixin):
    description = fields.Str(required=True, allow_none=True)
    videos = fields.List(fields.Nested(VideosArgsSchema()), required=True, allow_none=True)
    gradeScale = fields.Str(required=True, allow_none=False, validate=validate.Length(max=120))
    type = fields.Enum(LineTypeEnum, required=True, allow_none=False)
    authorRating = fields.Integer(required=True, allow_none=True, validate=validate_rating)
    faYear = fields.Integer(required=True, allow_none=True, validate=validate_fa_year)
    faDate = fields.Date(required=True, allow_none=True, validate=validate_fa_date)
    secret = fields.Boolean(required=True, allow_none=False)
    eliminate = fields.Boolean(required=True, allow_none=False)
    traverse = fields.Boolean(required=True, allow_none=False)
    highball = fields.Boolean(required=True, allow_none=False)
    lowball = fields.Boolean(required=True, allow_none=False)
    morpho = fields.Boolean(required=True, allow_none=False)
    noTopout = fields.Boolean(required=True, allow_none=False)
    badDropzone = fields.Boolean(required=True, allow_none=False)
    childFriendly = fields.Boolean(required=True, allow_none=False)
    roof = fields.Boolean(required=True, allow_none=False)
    slab = fields.Boolean(required=True, allow_none=False)
    vertical = fields.Boolean(required=True, allow_none=False)
    overhang = fields.Boolean(required=True, allow_none=False)
    athletic = fields.Boolean(required=True, allow_none=False)
    technical = fields.Boolean(required=True, allow_none=False)
    endurance = fields.Boolean(required=True, allow_none=False)
    cruxy = fields.Boolean(required=True, allow_none=False)
    dyno = fields.Boolean(required=True, allow_none=False)
    jugs = fields.Boolean(required=True, allow_none=False)
    sloper = fields.Boolean(required=True, allow_none=False)
    crimps = fields.Boolean(required=True, allow_none=False)
    pockets = fields.Boolean(required=True, allow_none=False)
    pinches = fields.Boolean(required=True, allow_none=False)
    crack = fields.Boolean(required=True, allow_none=False)
    dihedral = fields.Boolean(required=True, allow_none=False)
    compression = fields.Boolean(required=True, allow_none=False)
    arete = fields.Boolean(required=True, allow_none=False)
    mantle = fields.Boolean(required=True, allow_none=False)


batch_line_args = BatchLineArgsSchema()
line_args = LineArgsSchema()
