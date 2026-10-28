"""Store confirmed rating controversies.

Revision ID: b6d2a9c41e18
Revises: f4a8c2e91b06
Create Date: 2026-10-28

A dismissal remembers the signed gap between the author value and the
community value. The line stays out of the list while that gap is unchanged.
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "b6d2a9c41e18"
down_revision = "f4a8c2e91b06"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "rating_controversy_dismissals",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("line_id", UUID(), nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("gap", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["line_id"],
            ["lines.id"],
            name=op.f("fk_rating_controversy_dismissals_line_id"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rating_controversy_dismissals")),
        sa.UniqueConstraint("line_id", "kind", name="uq_rating_controversy_dismissals_line_kind"),
    )


def downgrade():
    op.drop_table("rating_controversy_dismissals")
