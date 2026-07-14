"""Add dark mode logo and bar chart colors to instance settings.

Revision ID: c0d1e2f3a4b5
Revises: f9a2b3c4d5e6
Create Date: 2026-06-27

"""

import sqlalchemy as sa
from alembic import op

revision = "c0d1e2f3a4b5"
down_revision = "f9a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("dark_logo_image_id", sa.UUID(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "dark_bar_chart_color",
                sa.String(length=30),
                nullable=False,
                server_default="rgb(248, 113, 113)",
            )
        )
        batch_op.add_column(
            sa.Column(
                "dark_bar_chart_accent_color",
                sa.String(length=30),
                nullable=False,
                server_default="rgb(253, 224, 71)",
            )
        )
        batch_op.create_foreign_key(
            "fk_instance_settings_dark_logo_image_id_files",
            "files",
            ["dark_logo_image_id"],
            ["id"],
        )


def downgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_constraint(
            "fk_instance_settings_dark_logo_image_id_files",
            type_="foreignkey",
        )
        batch_op.drop_column("dark_bar_chart_accent_color")
        batch_op.drop_column("dark_bar_chart_color")
        batch_op.drop_column("dark_logo_image_id")
