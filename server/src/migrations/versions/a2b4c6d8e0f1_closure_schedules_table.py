"""Closure schedules table.

Revision ID: a2b4c6d8e0f1
Revises: a9e7c2f4b831
Create Date: 2026-06-04

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "a2b4c6d8e0f1"
down_revision = "a9e7c2f4b831"
branch_labels = None
depends_on = None


def upgrade():
    schedule_type = postgresql.ENUM("ANNUAL", "PERMANENT", "FIXED", name="closurescheduletypeenum")

    op.create_table(
        "closure_schedules",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("time_created", sa.DateTime(), nullable=True),
        sa.Column("time_updated", sa.DateTime(), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(), nullable=True),
        sa.Column("schedule_type", schedule_type, nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("start_month", sa.SmallInteger(), nullable=True),
        sa.Column("start_day", sa.SmallInteger(), nullable=True),
        sa.Column("end_month", sa.SmallInteger(), nullable=True),
        sa.Column("end_day", sa.SmallInteger(), nullable=True),
        sa.Column("crag_id", postgresql.UUID(), nullable=True),
        sa.Column("sector_id", postgresql.UUID(), nullable=True),
        sa.Column("area_id", postgresql.UUID(), nullable=True),
        sa.Column("line_id", postgresql.UUID(), nullable=True),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["crag_id"], ["crags.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sector_id"], ["sectors.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["area_id"], ["areas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["line_id"], ["lines.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade():
    op.drop_table("closure_schedules")
    op.execute("DROP TYPE IF EXISTS closurescheduletypeenum")
