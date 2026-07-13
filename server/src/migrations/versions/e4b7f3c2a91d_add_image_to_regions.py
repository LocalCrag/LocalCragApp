"""Add image to regions

Revision ID: e4b7f3c2a91d
Revises: c0d1e2f3a4b5
Create Date: 2026-07-08 22:15:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "e4b7f3c2a91d"
down_revision = "c0d1e2f3a4b5"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("regions", schema=None) as batch_op:
        batch_op.add_column(sa.Column("image_id", postgresql.UUID(), nullable=True))
        batch_op.create_foreign_key(
            batch_op.f("regions_image_id_fkey"),
            "files",
            ["image_id"],
            ["id"],
        )

    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            UPDATE regions
            SET image_id = instance_settings.main_bg_image_id
            FROM instance_settings
            WHERE regions.image_id IS NULL
              AND instance_settings.main_bg_image_id IS NOT NULL
            """
        )
    )


def downgrade():
    with op.batch_alter_table("regions", schema=None) as batch_op:
        batch_op.drop_constraint(batch_op.f("regions_image_id_fkey"), type_="foreignkey")
        batch_op.drop_column("image_id")
