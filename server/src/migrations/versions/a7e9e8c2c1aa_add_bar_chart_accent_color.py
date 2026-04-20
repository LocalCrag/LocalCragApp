"""add bar chart accent color

Revision ID: a7e9e8c2c1aa
Revises: c4e8f1a92b10
Create Date: 2026-04-20 09:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a7e9e8c2c1aa"
down_revision = "c4e8f1a92b10"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "bar_chart_accent_color",
                sa.String(length=30),
                nullable=False,
                server_default="rgb(250, 204, 21)",
            )
        )


def downgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_column("bar_chart_accent_color")
