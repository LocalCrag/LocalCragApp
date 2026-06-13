"""Remove disable_fa_in_ascents from instance_settings.

Revision ID: a9e7c2f4b831
Revises: f1a2b3c4d5e6
Create Date: 2026-06-10

FA visibility in the ascent form is now derived from gym_mode directly.
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a9e7c2f4b831"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_column("disable_fa_in_ascents")


def downgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "disable_fa_in_ascents",
                sa.Boolean(),
                nullable=False,
                server_default="false",
            )
        )
