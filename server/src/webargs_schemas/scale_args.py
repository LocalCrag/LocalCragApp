from marshmallow import ValidationError
from webargs import fields

from models.enums.line_type_enum import LineTypeEnum


def validate_bar_chart_brackets(brackets):
    if not all(bracket.get("value") > 0 for bracket in brackets):
        raise ValidationError("All bar chart bracket values must be greater than 0.")


def validate_stacked_chart_brackets(brackets):
    if not all(bracket > 0 for bracket in brackets):
        raise ValidationError("All stacked chart bracket values must be greater than 0.")


def validate_grade_names_unique(grades):
    grade_names = [grade.get("name") for grade in grades]
    if len(grade_names) != len(set(grade_names)):
        raise ValidationError("Grade names must be unique.")


scale_grades_args = {
    "name": fields.Str(required=True, allow_none=False),
    "value": fields.Integer(required=True, allow_none=False),
}

stacked_chart_bracket_args = {
    "name": fields.String(required=True, allow_none=False),
    "value": fields.Integer(required=True, allow_none=False),
}

grade_bracket_args = {
    "barChartBrackets": fields.List(
        fields.Nested(stacked_chart_bracket_args),
        required=True,
        allow_none=False,
        validate=validate_bar_chart_brackets,
    ),
    "stackedChartBrackets": fields.List(
        fields.Integer(), required=True, allow_none=False, validate=validate_stacked_chart_brackets
    ),
}

scale_args = {
    "name": fields.String(required=False),
    "type": fields.Enum(LineTypeEnum, required=True, allow_none=False),
    "grades": fields.List(
        fields.Nested(scale_grades_args),
        required=True,
        allow_none=False,
        validate=validate_grade_names_unique,
    ),
    "gradeBrackets": fields.Nested(grade_bracket_args, required=True, allow_none=False),
}
