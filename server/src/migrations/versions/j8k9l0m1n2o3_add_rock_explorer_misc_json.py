"""Add parking_sites and paths JSON to rock explorer features

Revision ID: j8k9l0m1n2o3
Revises: i7j8k9l0m1n2
Create Date: 2026-07-28 22:55:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision = "j8k9l0m1n2o3"
down_revision = "i7j8k9l0m1n2"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("rock_explorer_features", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "parking_sites",
                JSON(),
                nullable=False,
                server_default=sa.text("'[]'::json"),
            )
        )
        batch_op.add_column(
            sa.Column(
                "paths",
                JSON(),
                nullable=False,
                server_default=sa.text("'[]'::json"),
            )
        )


def downgrade():
    with op.batch_alter_table("rock_explorer_features", schema=None) as batch_op:
        batch_op.drop_column("paths")
        batch_op.drop_column("parking_sites")
