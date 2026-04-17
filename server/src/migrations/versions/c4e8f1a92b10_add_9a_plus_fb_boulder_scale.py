"""Add 9A+ to default FB boulder scale

Revision ID: c4e8f1a92b10
Revises: b7a5737f7400
Create Date: 2026-04-17

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session

# revision identifiers, used by Alembic.
revision = "c4e8f1a92b10"
down_revision = "b7a5737f7400"
branch_labels = None
depends_on = None

Base = declarative_base()


def _name_is_9a_plus(name) -> bool:
    s = str(name or "").casefold().replace("ü", "+")
    return s == "9a+"


def _name_is_9a(name) -> bool:
    return str(name or "").casefold() == "9a"


class Scale(Base):
    __tablename__ = "scales"
    name = sa.Column(sa.String(32), nullable=False, primary_key=True)
    type = sa.Column(sa.Enum("BOULDER", "SPORT", "TRAD", name="linetypeenum"), nullable=False, primary_key=True)
    grades = sa.Column(postgresql.JSON, nullable=False)
    grade_brackets = sa.Column(postgresql.JSON, nullable=False)


def upgrade():
    bind = op.get_bind()
    session = Session(bind=bind)
    try:
        scale = session.query(Scale).filter(Scale.name == "FB", Scale.type == "BOULDER").one_or_none()
        if scale is None:
            return
        grades = list(scale.grades)
        if any(_name_is_9a_plus(g.get("name")) or g.get("value") == 29 for g in grades):
            return
        if grades and _name_is_9a(grades[-1].get("name")) and grades[-1].get("value") == 28:
            grades.append({"name": "9A+", "value": 29})
            scale.grades = grades
            session.add(scale)
            session.commit()
    finally:
        session.close()


def downgrade():
    pass
