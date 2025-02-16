from webargs import fields

from models.enums.line_type_enum import LineTypeEnum

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
        validate=lambda gbs: all(gb.get("value") > 0 for gb in gbs),
    ),
    "stackedChartBrackets": fields.List(
        fields.Integer(), required=True, allow_none=False, validate=lambda gbs: all(gb > 0 for gb in gbs)
    ),
}

scale_args = {
    "name": fields.String(required=False),
    "type": fields.Enum(LineTypeEnum, required=True, allow_none=False),
    "grades": fields.List(
        fields.Nested(scale_grades_args),
        required=True,
        allow_none=False,
        validate=lambda gs: len(gs) == len(set([g["name"] for g in gs])),  # Grade names must be unique
    ),
    "gradeBrackets": fields.Nested(grade_bracket_args, required=True, allow_none=False),
}
