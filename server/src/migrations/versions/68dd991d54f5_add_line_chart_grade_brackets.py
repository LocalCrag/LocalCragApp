"""Add line chart grade brackets

Revision ID: 68dd991d54f5
Revises: 4da80c2a64d6
Create Date: 2025-02-12 20:11:35.096135

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session

# revision identifiers, used by Alembic.
revision = "68dd991d54f5"
down_revision = "4da80c2a64d6"
branch_labels = None
depends_on = None


Base = declarative_base()


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

        # Don't do anything if the grade_brackets are already in the correct format (e.g. for new instances)
        if isinstance(scale.grade_brackets, dict):
            # They have been a list before, so if they are already a dict, we can assume they are in the correct format
            continue

        bar_chart_brackets = []

        for i in range(0, len(scale.grade_brackets)):
            lower_grade = None
            upper_grade = scale.grades[-1]["name"]
            last_bracket_value = scale.grade_brackets[i - 1] if i > 0 else 0
            for grade in scale.grades:
                if grade["value"] == last_bracket_value + 1:
                    lower_grade = grade["name"]
                    continue
                if grade["value"] == scale.grade_brackets[i]:
                    upper_grade = grade["name"]
                    break
            bar_chart_brackets.append({"name": f"{lower_grade} - {upper_grade}", "value": scale.grade_brackets[i]})

        scale.grade_brackets = {"stackedChartBrackets": scale.grade_brackets, "barChartBrackets": bar_chart_brackets}
        session.add(scale)
    session.commit()


def downgrade():
    bind = op.get_bind()
    session = Session(bind=bind)

    scales = session.query(Scale).all()
    for scale in scales:
        scale.grade_brackets = scale.grade_brackets["stackedChartBrackets"]
        session.add(scale)
    session.commit()
