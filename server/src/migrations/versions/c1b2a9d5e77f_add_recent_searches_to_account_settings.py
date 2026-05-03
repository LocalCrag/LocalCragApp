"""add recent searches table

Revision ID: c1b2a9d5e77f
Revises: a7e9e8c2c1aa
Create Date: 2026-04-23 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = "c1b2a9d5e77f"
down_revision = "a7e9e8c2c1aa"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "recent_searches",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("user_id", UUID(), nullable=False),
        sa.Column("object_type", sa.Unicode(length=255), nullable=False),
        sa.Column("object_id", UUID(), nullable=False),
        sa.Column("time_created", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_recent_searches_user_id"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recent_searches")),
        sa.UniqueConstraint("user_id", "object_type", "object_id", name="uq_recent_search_user_object"),
    )
    with op.batch_alter_table("recent_searches", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_recent_searches_user_id"), ["user_id"], unique=False)


def downgrade():
    with op.batch_alter_table("recent_searches", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_recent_searches_user_id"))
    op.drop_table("recent_searches")
