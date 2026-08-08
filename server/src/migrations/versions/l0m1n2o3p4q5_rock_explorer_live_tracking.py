"""Add rock explorer live-tracking status and recording columns

Revision ID: l0m1n2o3p4q5
Revises: k9l0m1n2o3p4
Create Date: 2026-08-04 21:45:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM, JSON

# revision identifiers, used by Alembic.
revision = "l0m1n2o3p4q5"
down_revision = "k9l0m1n2o3p4"
branch_labels = None
depends_on = None


def upgrade():
    # Use postgresql.ENUM with create_type=False. sa.Enum(..., create_type=False) still
    # emits CREATE TYPE on add_column and fails with DuplicateObject.
    status_enum = ENUM("draft", "published", name="rockexplorerfeaturestatusenum", create_type=False)
    status_enum.create(op.get_bind(), checkfirst=True)

    with op.batch_alter_table("rock_explorer_features", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("status", status_enum, nullable=False, server_default="published"),
        )
        batch_op.add_column(sa.Column("recording_device_id", sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column("recording_updated_at", sa.DateTime(), nullable=True))
        batch_op.alter_column("geometry", existing_type=JSON(), nullable=True)


def downgrade():
    with op.batch_alter_table("rock_explorer_features", schema=None) as batch_op:
        batch_op.alter_column("geometry", existing_type=JSON(), nullable=False)
        batch_op.drop_column("recording_updated_at")
        batch_op.drop_column("recording_device_id")
        batch_op.drop_column("status")

    ENUM(name="rockexplorerfeaturestatusenum", create_type=False).drop(op.get_bind(), checkfirst=True)
