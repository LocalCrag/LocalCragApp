"""Add color_scheme to account_settings

Revision ID: e8a1b2c3d4f5
Revises: c4e8f1a2b3d4
Create Date: 2026-06-25

"""

import sqlalchemy as sa
from alembic import op

revision = "e8a1b2c3d4f5"
down_revision = "c4e8f1a2b3d4"
branch_labels = None
depends_on = None


def upgrade():
    colorschemeenum = sa.Enum(
        "light",
        "dark",
        "system",
        name="colorschemeenum",
        create_type=True,
    )
    colorschemeenum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "account_settings",
        sa.Column(
            "color_scheme",
            colorschemeenum,
            nullable=False,
            server_default="system",
        ),
    )


def downgrade():
    op.drop_column("account_settings", "color_scheme")
    sa.Enum(name="colorschemeenum").drop(op.get_bind(), checkfirst=True)
