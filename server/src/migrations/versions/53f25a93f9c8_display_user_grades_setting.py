"""display user grades setting

Revision ID: 53f25a93f9c8
Revises: 68dd991d54f5
Create Date: 2025-04-27 06:09:07.996028

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "53f25a93f9c8"
down_revision = "68dd991d54f5"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("display_user_grades", sa.Boolean(), server_default="false", nullable=False))


def downgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_column("display_user_grades")
