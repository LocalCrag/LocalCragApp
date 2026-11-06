"""Default grade diagrams to visible on existing scales.

Revision ID: a7c3e9b41d20
Revises: b6d2a9c41e18
Create Date: 2026-10-31

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

revision = "a7c3e9b41d20"
down_revision = "b6d2a9c41e18"
branch_labels = None
depends_on = None

Base = declarative_base()


class Scale(Base):
    __tablename__ = "scales"
    name = sa.Column(sa.String(32), nullable=False, primary_key=True)
    type = sa.Column(
        sa.Enum("BOULDER", "SPORT", "TRAD", name="linetypeenum", create_type=False),
        nullable=False,
        primary_key=True,
    )
    grades = sa.Column(postgresql.JSON, nullable=False)
    grade_brackets = sa.Column(postgresql.JSON, nullable=False)


def upgrade():
    bind = op.get_bind()
    session = Session(bind=bind)
    try:
        for scale in session.query(Scale).all():
            brackets = scale.grade_brackets
            if not isinstance(brackets, dict) or "showDiagrams" in brackets:
                continue
            scale.grade_brackets = {**brackets, "showDiagrams": True}
            flag_modified(scale, "grade_brackets")
            session.add(scale)
        session.commit()
    finally:
        session.close()


def downgrade():
    bind = op.get_bind()
    session = Session(bind=bind)
    try:
        for scale in session.query(Scale).all():
            brackets = scale.grade_brackets
            if not isinstance(brackets, dict) or "showDiagrams" not in brackets:
                continue
            updated = dict(brackets)
            updated.pop("showDiagrams", None)
            scale.grade_brackets = updated
            flag_modified(scale, "grade_brackets")
            session.add(scale)
        session.commit()
    finally:
        session.close()
