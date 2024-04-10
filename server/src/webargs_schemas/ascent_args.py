import datetime

from webargs import fields

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
    "gradeName": fields.String(required=True),
    "gradeScale": fields.String(required=True),
    "rating": fields.Integer(required=True, allow_none=True),
    "comment": fields.Str(required=True, allow_none=True),
    "year": fields.Integer(required=True, allow_none=True, validate=lambda year: year <= datetime.date.today().year),
    "date": fields.Date(required=True, allow_none=True, format='iso8601',
                        validate=lambda date: date <= datetime.date.today()),
}


def cross_validate_ascent_args(args):
    if args['soft'] and args['hard']:
        return False
    if args['year'] and args['date']:
        return False
    return True
