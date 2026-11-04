from sqlalchemy import Index, false, text
from sqlalchemy.dialects.postgresql import JSON

from extensions import db
from models.enums.line_type_enum import LineTypeEnum

BOULDER_FB_SCALE_NAME = "FB"
BOULDER_V_SCALE_NAME = "V"
SPORT_UIAA_SCALE_NAME = "UIAA"
SPORT_FRENCH_SCALE_NAME = "French"
SPORT_YDS_SCALE_NAME = "YDS"
SPORT_EWBANK_SCALE_NAME = "Ewbank"
SPORT_SAXON_SCALE_NAME = "Saxon"
SPORT_KURTYKA_SCALE_NAME = "Kurtyka"
SPORT_CZECH_SCALE_NAME = "Czech-Slovak"
TRAD_BRITISH_SCALE_NAME = "British"

DEFAULT_SCALE_NAMES = {
    LineTypeEnum.BOULDER: BOULDER_FB_SCALE_NAME,
    LineTypeEnum.SPORT: SPORT_FRENCH_SCALE_NAME,
    LineTypeEnum.TRAD: TRAD_BRITISH_SCALE_NAME,
}

_PROJECT_GRADES = [
    {"name": "CLOSED_PROJECT", "value": -2},
    {"name": "OPEN_PROJECT", "value": -1},
    {"name": "UNGRADED", "value": 0},
]


def _grades(names: list[str]) -> list[dict]:
    grades = list(_PROJECT_GRADES)
    grades.extend({"name": name, "value": index} for index, name in enumerate(names, start=1))
    return grades


_FB_GRADE_NAMES = [
    "1",
    "2",
    "3",
    "4A",
    "4B",
    "4C",
    "5A",
    "5B",
    "5C",
    "6A",
    "6A+",
    "6B",
    "6B+",
    "6C",
    "6C+",
    "7A",
    "7A+",
    "7B",
    "7B+",
    "7C",
    "7C+",
    "8A",
    "8A+",
    "8B",
    "8B+",
    "8C",
    "8C+",
    "9A",
    "9A+",
]

_V_GRADE_NAMES = [
    "VB",
    "V0",
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "V6",
    "V7",
    "V8",
    "V9",
    "V10",
    "V11",
    "V12",
    "V13",
    "V14",
    "V15",
    "V16",
    "V17",
]

_UIAA_GRADE_NAMES = [
    "I",
    "II",
    "III",
    "IV-",
    "IV",
    "IV+",
    "V-",
    "V",
    "V+",
    "VI-",
    "VI",
    "VI+",
    "VII-",
    "VII",
    "VII+",
    "VIII-",
    "VIII",
    "VIII+",
    "IX-",
    "IX",
    "IX+",
    "X-",
    "X",
    "X+",
    "XI-",
    "XI",
    "XI+",
    "XII-",
    "XII",
]

_FRENCH_GRADE_NAMES = [
    "1",
    "2",
    "3",
    "4a",
    "4b",
    "4c",
    "5a",
    "5a+",
    "5b",
    "5b+",
    "5c",
    "5c+",
    "6a",
    "6a+",
    "6b",
    "6b+",
    "6c",
    "6c+",
    "7a",
    "7a+",
    "7b",
    "7b+",
    "7c",
    "7c+",
    "8a",
    "8a+",
    "8b",
    "8b+",
    "8c",
    "8c+",
    "9a",
    "9a+",
    "9b",
    "9b+",
    "9c",
    "9c+",
]

_YDS_GRADE_NAMES = [
    "5.0",
    "5.1",
    "5.2",
    "5.3",
    "5.4",
    "5.5",
    "5.6",
    "5.7",
    "5.8",
    "5.9",
    "5.10a",
    "5.10b",
    "5.10c",
    "5.10d",
    "5.11a",
    "5.11b",
    "5.11c",
    "5.11d",
    "5.12a",
    "5.12b",
    "5.12c",
    "5.12d",
    "5.13a",
    "5.13b",
    "5.13c",
    "5.13d",
    "5.14a",
    "5.14b",
    "5.14c",
    "5.14d",
    "5.15a",
    "5.15b",
    "5.15c",
    "5.15d",
]

_EWBANK_GRADE_NAMES = [str(grade) for grade in range(1, 40)]

_SANDSTONE_GRADE_NAMES = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VIIa",
    "VIIb",
    "VIIc",
    "VIIIa",
    "VIIIb",
    "VIIIc",
    "IXa",
    "IXb",
    "IXc",
    "Xa",
    "Xb",
    "Xc",
    "XIa",
    "XIb",
    "XIc",
    "XIIa",
    "XIIb",
    "XIIc",
    "XIIIa",
    "XIIIb",
    "XIIIc",
]

_KURTYKA_GRADE_NAMES = [
    "I",
    "II",
    "III",
    "IV-",
    "IV",
    "IV+",
    "V-",
    "V",
    "V+",
    "VI-",
    "VI",
    "VI+",
    "VI.1",
    "VI.1+",
    "VI.2",
    "VI.2+",
    "VI.3",
    "VI.3+",
    "VI.4",
    "VI.4+",
    "VI.5",
    "VI.5+",
    "VI.6",
    "VI.6+",
    "VI.7",
    "VI.7+",
    "VI.8",
    "VI.8+",
]

_BRITISH_GRADE_NAMES = [
    "M",
    "D",
    "VD",
    "HVD",
    "S",
    "HS",
    "VS 4b",
    "VS 4c",
    "VS 5a",
    "HVS 4c",
    "HVS 5a",
    "HVS 5b",
    "HVS 5c",
    "E1 5a",
    "E1 5b",
    "E1 5c",
    "E1 6a",
    "E2 5b",
    "E2 5c",
    "E2 6a",
    "E2 6b",
    "E3 5c",
    "E3 6a",
    "E3 6b",
    "E4 6a",
    "E4 6b",
    "E4 6c",
    "E5 6a",
    "E5 6b",
    "E5 6c",
    "E6 6b",
    "E6 6c",
    "E6 7a",
    "E7 6c",
    "E7 7a",
    "E7 7b",
    "E8 6c",
    "E8 7a",
    "E8 7b",
    "E9 7a",
    "E9 7b",
    "E10 7a",
    "E10 7b",
    "E11 7a",
    "E11 7b",
]

_CHART_COLORS = ("#eab308", "#3b82f6", "#ef4444", "#22c55e")


def _brackets(bar_chart: list[tuple[str, int]], stacked_values: list[int]) -> dict:
    return {
        "showDiagrams": True,
        "barChartBrackets": [{"name": name, "value": value} for name, value in bar_chart],
        "stackedChartBrackets": [
            {"value": value, "color": _CHART_COLORS[index]} for index, value in enumerate(stacked_values)
        ],
    }


GRADES = {
    LineTypeEnum.BOULDER: {
        BOULDER_FB_SCALE_NAME: _grades(_FB_GRADE_NAMES),
        BOULDER_V_SCALE_NAME: _grades(_V_GRADE_NAMES),
    },
    LineTypeEnum.SPORT: {
        SPORT_UIAA_SCALE_NAME: _grades(_UIAA_GRADE_NAMES),
        SPORT_FRENCH_SCALE_NAME: _grades(_FRENCH_GRADE_NAMES),
        SPORT_YDS_SCALE_NAME: _grades(_YDS_GRADE_NAMES),
        SPORT_EWBANK_SCALE_NAME: _grades(_EWBANK_GRADE_NAMES),
        SPORT_SAXON_SCALE_NAME: _grades(_SANDSTONE_GRADE_NAMES),
        SPORT_KURTYKA_SCALE_NAME: _grades(_KURTYKA_GRADE_NAMES),
        SPORT_CZECH_SCALE_NAME: _grades(_SANDSTONE_GRADE_NAMES),
    },
    LineTypeEnum.TRAD: {
        TRAD_BRITISH_SCALE_NAME: _grades(_BRITISH_GRADE_NAMES),
    },
}

GRADE_BRACKETS = {
    LineTypeEnum.BOULDER: {
        BOULDER_FB_SCALE_NAME: _brackets(
            [
                ("1-3", 3),
                ("4A", 4),
                ("4B", 5),
                ("4C", 6),
                ("5A", 7),
                ("5B", 8),
                ("5C", 9),
                ("6A", 11),
                ("6B", 13),
                ("6C", 15),
                ("7A", 17),
                ("7B", 19),
                ("7C", 21),
                (">8", 22),
            ],
            [9, 15, 21, 22],
        ),
        BOULDER_V_SCALE_NAME: _brackets(
            [
                ("VB", 1),
                ("V0", 2),
                ("V1", 3),
                ("V2", 4),
                ("V3", 5),
                ("V4", 6),
                ("V5", 7),
                ("V6", 8),
                ("V7", 9),
                ("V8", 10),
                ("V9", 11),
                (">=V10", 12),
            ],
            [4, 7, 10, 11],
        ),
    },
    LineTypeEnum.SPORT: {
        SPORT_UIAA_SCALE_NAME: _brackets(
            [
                ("I-III", 3),
                ("IV", 6),
                ("V", 9),
                ("VI", 12),
                ("VII", 15),
                ("VIII", 18),
                ("IX", 21),
                ("X", 24),
                (">= XI", 25),
            ],
            [9, 15, 21, 22],
        ),
        SPORT_FRENCH_SCALE_NAME: _brackets(
            [
                ("1-3", 3),
                ("4", 6),
                ("5", 12),
                ("6a", 14),
                ("6b", 16),
                ("6c", 18),
                ("7a", 20),
                ("7b", 22),
                ("7c", 24),
                ("8a", 26),
                ("8b", 28),
                ("8c", 30),
                (">=9a", 31),
            ],
            [12, 18, 24, 25],
        ),
        SPORT_YDS_SCALE_NAME: _brackets(
            [
                ("5.0-5.6", 7),
                ("5.7", 8),
                ("5.8", 9),
                ("5.9", 10),
                ("5.10", 14),
                ("5.11", 18),
                ("5.12", 22),
                ("5.13", 26),
                ("5.14", 30),
                (">=5.15", 31),
            ],
            [10, 18, 26, 27],
        ),
        SPORT_EWBANK_SCALE_NAME: _brackets(
            [
                ("1-10", 10),
                ("12", 12),
                ("14", 14),
                ("16", 16),
                ("18", 18),
                ("20", 20),
                ("22", 22),
                ("24", 24),
                ("26", 26),
                ("28", 28),
                ("30", 30),
                (">=32", 32),
            ],
            [16, 22, 28, 29],
        ),
        SPORT_SAXON_SCALE_NAME: _brackets(
            [
                ("I-III", 3),
                ("IV", 4),
                ("V", 5),
                ("VI", 6),
                ("VII", 9),
                ("VIII", 12),
                ("IX", 15),
                ("X", 18),
                ("XI", 21),
                (">=XII", 22),
            ],
            [6, 12, 18, 19],
        ),
        SPORT_KURTYKA_SCALE_NAME: _brackets(
            [
                ("I-III", 3),
                ("IV", 6),
                ("V", 9),
                ("VI", 12),
                ("VI.1", 14),
                ("VI.2", 16),
                ("VI.3", 18),
                ("VI.4", 20),
                ("VI.5", 22),
                ("VI.6", 24),
                (">=VI.7", 25),
            ],
            [9, 16, 20, 21],
        ),
        SPORT_CZECH_SCALE_NAME: _brackets(
            [
                ("I-III", 3),
                ("IV", 4),
                ("V", 5),
                ("VI", 6),
                ("VII", 9),
                ("VIII", 12),
                ("IX", 15),
                ("X", 18),
                ("XI", 21),
                (">=XII", 22),
            ],
            [6, 12, 18, 19],
        ),
    },
    LineTypeEnum.TRAD: {
        TRAD_BRITISH_SCALE_NAME: _brackets(
            [
                ("M-HS", 6),
                ("VS", 9),
                ("HVS", 13),
                ("E1", 17),
                ("E2", 21),
                ("E3", 24),
                ("E4", 27),
                ("E5", 30),
                ("E6", 33),
                ("E7", 36),
                ("E8", 39),
                (">=E9", 40),
            ],
            [6, 17, 27, 28],
        ),
    },
}


class Scale(db.Model):
    __tablename__ = "scales"
    __table_args__ = (
        Index(
            "uq_scales_one_default_per_type",
            "type",
            unique=True,
            postgresql_where=text("is_default"),
        ),
    )

    name = db.Column(db.String(32), nullable=False, primary_key=True)
    type = db.Column(db.Enum(LineTypeEnum), nullable=False, primary_key=True)
    grades = db.Column(JSON, nullable=False)
    grade_brackets = db.Column(JSON, nullable=False)
    is_default = db.Column(db.Boolean, nullable=False, default=False, server_default=false())
