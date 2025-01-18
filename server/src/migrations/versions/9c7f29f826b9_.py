"""empty message

Revision ID: 9c7f29f826b9
Revises: 973a97b12ede
Create Date: 2025-01-15 11:33:15.228255

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "9c7f29f826b9"
down_revision = "973a97b12ede"
branch_labels = None
depends_on = None


def upgrade():
    # Remove now invalid enum values
    op.execute(
        "CREATE TYPE menuitemtypeenum_new AS ENUM('MENU_PAGE', 'TOPO', 'ASCENTS', 'RANKING', 'NEWS', 'GALLERY', "
        "'HISTORY', 'URL')"
    )
    op.execute(
        "ALTER TABLE menu_items ALTER COLUMN type TYPE menuitemtypeenum_new USING type::text::menuitemtypeenum_new"
    )
    op.execute("DROP TYPE menuitemtypeenum")
    op.execute("ALTER TYPE menuitemtypeenum_new RENAME TO menuitemtypeenum")


def downgrade():
    pass
