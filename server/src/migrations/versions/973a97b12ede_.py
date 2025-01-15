"""empty message

Revision ID: 973a97b12ede
Revises: 8a649f84c0c5
Create Date: 2025-01-14 14:31:55.537428

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String

# revision identifiers, used by Alembic.
revision = "973a97b12ede"
down_revision = "8a649f84c0c5"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE menuitemtypeenum ADD VALUE 'URL'")
    # Commit the transaction to make the new enum value available
    conn = op.get_bind()
    conn.commit()
    with op.batch_alter_table("menu_items", schema=None) as batch_op:
        batch_op.add_column(sa.Column("url", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("title", sa.String(length=120), nullable=True))

    # Data migration
    instance_settings = table("instance_settings", column("instagram_url", String), column("youtube_url", String))
    conn = op.get_bind()
    settings = conn.execute(instance_settings.select()).fetchone()
    menu_items = table(
        "menu_items",
        column("type", String),
        column("position", String),
        column("icon", String),
        column("title", String),
        column("url", String),
    )
    if settings[0]:
        conn.execute(
            menu_items.update()
            .where(menu_items.c.type == "INSTAGRAM")
            .values(url=settings[0], type="URL", icon="pi-instagram", title="Instagram")
        )
    if settings[1]:
        conn.execute(
            menu_items.update()
            .where(menu_items.c.type == "YOUTUBE")
            .values(url=settings[1], type="URL", icon="pi-youtube", title="YouTube")
        )

    conn.commit()

    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_column("instagram_url")
        batch_op.drop_column("youtube_url")

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
    with op.batch_alter_table("menu_items", schema=None) as batch_op:
        batch_op.add_column(sa.Column("url", sa.String(length=120), nullable=True))
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("youtube_url", sa.VARCHAR(length=120), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column("instagram_url", sa.VARCHAR(length=120), autoincrement=False, nullable=True))
