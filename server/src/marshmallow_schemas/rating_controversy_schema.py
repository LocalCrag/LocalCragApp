from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from models.enums.line_type_enum import LineTypeEnum


class RatingControversySpotSchema(ma.Schema):
    name = fields.String()
    slug = fields.String()


class RatingControversyLineSchema(ma.Schema):
    id = fields.String()
    name = fields.String()
    slug = fields.String()
    type = EnumField(LineTypeEnum, by_value=True)
    gradeScale = fields.String(attribute="grade_scale")
    authorGradeValue = fields.Integer(attribute="author_grade_value")
    userGradeValue = fields.Integer(attribute="user_grade_value")
    authorRating = fields.Integer(attribute="author_rating", allow_none=True)
    userRating = fields.Integer(attribute="user_rating", allow_none=True)
    ascentCount = fields.Integer(attribute="ascent_count")
    gradeDiffers = fields.Method("get_grade_differs")
    ratingDiffers = fields.Method("get_rating_differs")
    area = fields.Nested(RatingControversySpotSchema())
    sector = fields.Nested(RatingControversySpotSchema(), attribute="area.sector")
    crag = fields.Nested(RatingControversySpotSchema(), attribute="area.sector.crag")

    def get_grade_differs(self, line):
        return line.author_grade_value != line.user_grade_value

    def get_rating_differs(self, line):
        return line.author_rating is not None and line.author_rating != line.user_rating


rating_controversy_lines_schema = RatingControversyLineSchema(many=True)
