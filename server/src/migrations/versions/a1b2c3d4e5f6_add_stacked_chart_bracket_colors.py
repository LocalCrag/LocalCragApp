"""Add colors to stacked chart grade brackets.

Revision ID: a1b2c3d4e5f6
Revises: e8f0a2b4c6d5
Create Date: 2026-06-19 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session

revision = "a1b2c3d4e5f6"
down_revision = "e8f0a2b4c6d5"
branch_labels = None
depends_on = None

Base = declarative_base()

DEFAULT_STACKED_CHART_BRACKET_COLORS = [
    "#eab308",
    "#3b82f6",
    "#ef4444",
    "#22c55e",
    "#f97316",
    "#14b8a6",
    "#6366f1",
    "#64748b",
]


class Scale(Base):
    __tablename__ = "scales"
    name = sa.Column(sa.String(32), nullable=False, primary_key=True)
    type = sa.Column(sa.Enum("BOULDER", "SPORT", name="linetypeenum"), nullable=False, primary_key=True)
    grades = sa.Column(postgresql.JSON, nullable=False)
    grade_brackets = sa.Column(postgresql.JSON, nullable=False)


def upgrade():
    bind = op.get_bind()
    session = Session(bind=bind)

    scales = session.query(Scale).all()
    for scale in scales:
        stacked_brackets = scale.grade_brackets.get("stackedChartBrackets", [])
        if not stacked_brackets:
            continue
        if isinstance(stacked_brackets[0], dict):
            continue

        scale.grade_brackets["stackedChartBrackets"] = [
            {
                "value": value,
                "color": DEFAULT_STACKED_CHART_BRACKET_COLORS[index % len(DEFAULT_STACKED_CHART_BRACKET_COLORS)],
            }
            for index, value in enumerate(stacked_brackets)
        ]
        session.add(scale)
    session.commit()


def downgrade():
    bind = op.get_bind()
    session = Session(bind=bind)

    scales = session.query(Scale).all()
    for scale in scales:
        stacked_brackets = scale.grade_brackets.get("stackedChartBrackets", [])
        if not stacked_brackets:
            continue
        if isinstance(stacked_brackets[0], int):
            continue

        scale.grade_brackets["stackedChartBrackets"] = [bracket["value"] for bracket in stacked_brackets]
        session.add(scale)
    session.commit()
