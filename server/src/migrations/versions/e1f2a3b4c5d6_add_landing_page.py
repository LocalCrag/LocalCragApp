"""Add configurable landing page to instance settings.

Revision ID: e1f2a3b4c5d6
Revises: d9e0f1a2b3c4
Create Date: 2026-10-17

"""

import sqlalchemy as sa
from alembic import op

revision = "e1f2a3b4c5d6"
down_revision = "d9e0f1a2b3c4"
branch_labels = None
depends_on = None


def upgrade():
    landing_page_enum = sa.Enum(
        "NEWS",
        "TOPO",
        "ASCENTS",
        "RANKING",
        "GALLERY",
        "HISTORY",
        "MENU_PAGE",
        name="landingpageenum",
    )
    landing_page_enum.create(op.get_bind(), checkfirst=True)

    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "landing_page",
                landing_page_enum,
                nullable=False,
                server_default="NEWS",
            )
        )
        batch_op.add_column(sa.Column("landing_menu_page_id", sa.UUID(), nullable=True))
        batch_op.create_foreign_key(
            "fk_instance_settings_landing_menu_page_id",
            "menu_pages",
            ["landing_menu_page_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_constraint("fk_instance_settings_landing_menu_page_id", type_="foreignkey")
        batch_op.drop_column("landing_menu_page_id")
        batch_op.drop_column("landing_page")

    sa.Enum(name="landingpageenum").drop(op.get_bind(), checkfirst=True)
