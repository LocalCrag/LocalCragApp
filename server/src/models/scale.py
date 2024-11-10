from sqlalchemy.dialects.postgresql import JSON

from extensions import db
from models.enums.line_type_enum import LineTypeEnum

GRADES = {
    LineTypeEnum.BOULDER: {
        "FB": [
            {"name": "CLOSED_PROJECT", "value": -2},
            {"name": "OPEN_PROJECT", "value": -1},
            {"name": "UNGRADED", "value": 0},
            {"name": "1", "value": 1},
            {"name": "2", "value": 2},
            {"name": "3", "value": 3},
            {"name": "4A", "value": 4},
            {"name": "4B", "value": 5},
            {"name": "4C", "value": 6},
            {"name": "5A", "value": 7},
            {"name": "5B", "value": 8},
            {"name": "5C", "value": 9},
            {"name": "6A", "value": 10},
            {"name": "6A+", "value": 11},
            {"name": "6B", "value": 12},
            {"name": "6B+", "value": 13},
            {"name": "6C", "value": 14},
            {"name": "6C+", "value": 15},
            {"name": "7A", "value": 16},
            {"name": "7A+", "value": 17},
            {"name": "7B", "value": 18},
            {"name": "7B+", "value": 19},
            {"name": "7C", "value": 20},
            {"name": "7C+", "value": 21},
            {"name": "8A", "value": 22},
            {"name": "8A+", "value": 23},
            {"name": "8B", "value": 24},
            {"name": "8B+", "value": 25},
            {"name": "8C", "value": 26},
            {"name": "8C+", "value": 27},
            {"name": "9A", "value": 28},
        ]
    },
    LineTypeEnum.SPORT: {
        "UIAA": [
            {"name": "CLOSED_PROJECT", "value": -2},
            {"name": "OPEN_PROJECT", "value": -1},
            {"name": "UNGRADED", "value": 0},
            {"name": "I", "value": 1},
            {"name": "II", "value": 2},
            {"name": "III", "value": 3},
            {"name": "IV-", "value": 4},
            {"name": "IV", "value": 5},
            {"name": "IV+", "value": 6},
            {"name": "V-", "value": 7},
            {"name": "V", "value": 8},
            {"name": "V+", "value": 9},
            {"name": "VI-", "value": 10},
            {"name": "VI", "value": 11},
            {"name": "VI+", "value": 12},
            {"name": "VII-", "value": 13},
            {"name": "VII", "value": 14},
            {"name": "VII+", "value": 15},
            {"name": "VIII-", "value": 16},
            {"name": "VIII", "value": 17},
            {"name": "VIII+", "value": 18},
            {"name": "IX-", "value": 19},
            {"name": "IX", "value": 20},
            {"name": "IX+", "value": 21},
            {"name": "X-", "value": 22},
            {"name": "X", "value": 23},
            {"name": "X+", "value": 24},
            {"name": "XI-", "value": 25},
            {"name": "XI", "value": 26},
            {"name": "XI+", "value": 27},
            {"name": "XII-", "value": 28},
            {"name": "XII", "value": 29},
        ]
    },
}


class Scale(db.Model):
    __tablename__ = "scales"

    name = db.Column(db.String(32), nullable=False, primary_key=True)
    type = db.Column(db.Enum(LineTypeEnum), nullable=False, primary_key=True)
    grades = db.Column(JSON, nullable=False)


def get_grade_value(grade_name, scale_name, line_type):
    # get_grade_value might be called very often, we should cache this
    scale = Scale.query.filter(Scale.type == line_type, Scale.name == scale_name).first()
    for grade in scale.grades:
        if grade["name"] == grade_name:
            return grade["value"]
    raise ValueError()
