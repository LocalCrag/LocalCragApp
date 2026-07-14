"""Remove auth_bg_image from instance_settings

Revision ID: f3a8c1d2e4b6
Revises: e4b7f3c2a91d
Create Date: 2026-07-11 21:00:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "f3a8c1d2e4b6"
down_revision = "e4b7f3c2a91d"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_constraint(
        "instance_settings_auth_bg_image_id_fkey",
        "instance_settings",
        type_="foreignkey",
    )
    op.drop_column("instance_settings", "auth_bg_image_id")


def downgrade():
    import sqlalchemy as sa
    from sqlalchemy.dialects import postgresql

    op.add_column(
        "instance_settings",
        sa.Column("auth_bg_image_id", postgresql.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "instance_settings_auth_bg_image_id_fkey",
        "instance_settings",
        "files",
        ["auth_bg_image_id"],
        ["id"],
    )
