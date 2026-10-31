"""Add a parent to menu items so header menus can nest.

Revision ID: c3a9e7b15d42
Revises: a7c3e9b41d20
Create Date: 2026-10-31

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "c3a9e7b15d42"
down_revision = "a7c3e9b41d20"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("menu_items", sa.Column("parent_id", UUID(), nullable=True))
    op.create_foreign_key(
        "fk_menu_items_parent_id",
        "menu_items",
        "menu_items",
        ["parent_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade():
    op.drop_constraint("fk_menu_items_parent_id", "menu_items", type_="foreignkey")
    op.drop_column("menu_items", "parent_id")
