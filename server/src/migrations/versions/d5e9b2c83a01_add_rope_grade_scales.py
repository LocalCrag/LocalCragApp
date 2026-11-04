"""Add YDS, Ewbank, Saxon, Kurtyka, Czech-Slovak, and British scales.

Revision ID: d5e9b2c83a01
Revises: c4d8a1e72b90
Create Date: 2026-11-03

Inserts each scale when that name is not already used for its line type.
"""

import json

import sqlalchemy as sa
from alembic import op

from models.enums.line_type_enum import LineTypeEnum
from models.scale import GRADE_BRACKETS, GRADES

revision = "d5e9b2c83a01"
down_revision = "c4d8a1e72b90"
branch_labels = None
depends_on = None

_ADDED_SCALES = (
    (LineTypeEnum.SPORT, "YDS"),
    (LineTypeEnum.SPORT, "Ewbank"),
    (LineTypeEnum.SPORT, "Saxon"),
    (LineTypeEnum.SPORT, "Kurtyka"),
    (LineTypeEnum.SPORT, "Czech-Slovak"),
    (LineTypeEnum.TRAD, "British"),
)


def upgrade():
    connection = op.get_bind()
    for line_type, name in _ADDED_SCALES:
        existing = connection.execute(
            sa.text("SELECT 1 FROM scales WHERE name = :name AND type = :line_type"),
            {"name": name, "line_type": line_type.value},
        ).first()
        if existing is not None:
            continue
        connection.execute(
            sa.text(
                "INSERT INTO scales (name, type, grades, grade_brackets) "
                "VALUES (:name, :line_type, CAST(:grades AS json), CAST(:grade_brackets AS json))"
            ),
            {
                "name": name,
                "line_type": line_type.value,
                "grades": json.dumps(GRADES[line_type][name]),
                "grade_brackets": json.dumps(GRADE_BRACKETS[line_type][name]),
            },
        )


def downgrade():
    connection = op.get_bind()
    for line_type, name in _ADDED_SCALES:
        in_use = connection.execute(
            sa.text("SELECT 1 FROM lines WHERE grade_scale = :name AND type = :line_type"),
            {"name": name, "line_type": line_type.value},
        ).first()
        if in_use is not None:
            continue
        connection.execute(
            sa.text("DELETE FROM scales WHERE name = :name AND type = :line_type"),
            {"name": name, "line_type": line_type.value},
        )
