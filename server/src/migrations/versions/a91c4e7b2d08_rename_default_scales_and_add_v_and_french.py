"""Add the V and French scales.

Revision ID: a91c4e7b2d08
Revises: f6a1c8e24b90
Create Date: 2026-11-01

FB and UIAA keep their names. V and French scales are added when missing.
"""

import json

import sqlalchemy as sa
from alembic import op

from models.enums.line_type_enum import LineTypeEnum
from models.scale import (
    BOULDER_FB_SCALE_NAME,
    BOULDER_V_SCALE_NAME,
    GRADE_BRACKETS,
    GRADES,
    SPORT_FRENCH_SCALE_NAME,
    SPORT_UIAA_SCALE_NAME,
)

revision = "a91c4e7b2d08"
down_revision = "f6a1c8e24b90"
branch_labels = None
depends_on = None

_RENAMES = (
    ("BOULDER", "FB", BOULDER_FB_SCALE_NAME, "default_boulder_scale"),
    ("SPORT", "UIAA", SPORT_UIAA_SCALE_NAME, "default_sport_scale"),
)
_ADDED_SCALES = (
    (LineTypeEnum.BOULDER, BOULDER_V_SCALE_NAME),
    (LineTypeEnum.SPORT, SPORT_FRENCH_SCALE_NAME),
)


def _json_value(value):
    if isinstance(value, str):
        return json.loads(value)
    return value


def _is_unused_builtin(connection, line_type: str, name: str, default_column: str) -> bool:
    """True when this row is the stock scale and nothing references it yet.

    add_scales() can insert the new names before this migration runs. That empty
    row would block the rename of the scale that is actually in use.
    """
    if _scale_in_use(connection, line_type, name, default_column):
        return False
    line_type_enum = LineTypeEnum[line_type]
    expected_grades = GRADES.get(line_type_enum, {}).get(name)
    expected_brackets = GRADE_BRACKETS.get(line_type_enum, {}).get(name)
    if expected_grades is None or expected_brackets is None:
        return False
    row = connection.execute(
        sa.text("SELECT grades, grade_brackets FROM scales WHERE name = :name AND type = :line_type"),
        {"name": name, "line_type": line_type},
    ).first()
    if row is None:
        return False
    return _json_value(row.grades) == expected_grades and _json_value(row.grade_brackets) == expected_brackets


def _rename_scale(connection, line_type: str, old_name: str, new_name: str, default_column: str) -> None:
    if old_name == new_name:
        return
    existing = connection.execute(
        sa.text("SELECT 1 FROM scales WHERE name = :name AND type = :line_type"),
        {"name": old_name, "line_type": line_type},
    ).first()
    if existing is None:
        return
    taken = connection.execute(
        sa.text("SELECT 1 FROM scales WHERE name = :name AND type = :line_type"),
        {"name": new_name, "line_type": line_type},
    ).first()
    if taken is not None:
        if not _is_unused_builtin(connection, line_type, new_name, default_column):
            return
        connection.execute(
            sa.text("DELETE FROM scales WHERE name = :name AND type = :line_type"),
            {"name": new_name, "line_type": line_type},
        )

    params = {"old_name": old_name, "new_name": new_name, "line_type": line_type}
    connection.execute(
        sa.text("UPDATE lines SET grade_scale = :new_name WHERE grade_scale = :old_name AND type = :line_type"),
        params,
    )
    connection.execute(
        sa.text("UPDATE rankings SET scale = :new_name WHERE scale = :old_name AND type = :line_type"),
        params,
    )
    connection.execute(
        sa.text(
            "UPDATE rock_explorer_features SET grade_scale = :new_name "
            "WHERE grade_scale = :old_name AND grade_line_type = :line_type"
        ),
        params,
    )
    for table in ("crags", "sectors", "areas"):
        connection.execute(
            sa.text(f"UPDATE {table} SET {default_column} = :new_name WHERE {default_column} = :old_name"),
            params,
        )
    connection.execute(
        sa.text("UPDATE scales SET name = :new_name WHERE name = :old_name AND type = :line_type"),
        params,
    )


def _insert_scale(connection, line_type: LineTypeEnum, name: str) -> None:
    existing = connection.execute(
        sa.text("SELECT 1 FROM scales WHERE name = :name AND type = :line_type"),
        {"name": name, "line_type": line_type.value},
    ).first()
    if existing is not None:
        return
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


def upgrade():
    connection = op.get_bind()
    for line_type, old_name, new_name, default_column in _RENAMES:
        _rename_scale(connection, line_type, old_name, new_name, default_column)
    for line_type, name in _ADDED_SCALES:
        _insert_scale(connection, line_type, name)


def _scale_in_use(connection, line_type: str, name: str, default_column: str) -> bool:
    params = {"name": name, "line_type": line_type}
    checks = (
        "SELECT 1 FROM lines WHERE grade_scale = :name AND type = :line_type",
        "SELECT 1 FROM rankings WHERE scale = :name AND type = :line_type",
        "SELECT 1 FROM rock_explorer_features WHERE grade_scale = :name AND grade_line_type = :line_type",
    )
    for statement in checks:
        if connection.execute(sa.text(statement), params).first() is not None:
            return True
    for table in ("crags", "sectors", "areas"):
        if (
            connection.execute(
                sa.text(f"SELECT 1 FROM {table} WHERE {default_column} = :name"),
                params,
            ).first()
            is not None
        ):
            return True
    return False


def downgrade():
    connection = op.get_bind()
    for line_type, old_name, new_name, default_column in _RENAMES:
        _rename_scale(connection, line_type, new_name, old_name, default_column)
    for line_type, name in _ADDED_SCALES:
        default_column = "default_boulder_scale" if line_type == LineTypeEnum.BOULDER else "default_sport_scale"
        if _scale_in_use(connection, line_type.value, name, default_column):
            continue
        connection.execute(
            sa.text("DELETE FROM scales WHERE name = :name AND type = :line_type"),
            {"name": name, "line_type": line_type.value},
        )
