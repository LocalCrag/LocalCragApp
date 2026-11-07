"""Replace WYSIWYG headings with paragraphs and drop font sizes.

Revision ID: c6d1e8a42f90
Revises: a4d8c2e91b07
Create Date: 2026-11-07

"""

import sqlalchemy as sa
from alembic import op

from util.html_inline_styles import replace_wysiwyg_headings_and_font_size

revision = "c6d1e8a42f90"
down_revision = "a4d8c2e91b07"
branch_labels = None
depends_on = None

_WYSIWYG_HTML_COLUMNS = (
    ("areas", "short_description"),
    ("areas", "description"),
    ("crags", "short_description"),
    ("crags", "description"),
    ("crags", "rules"),
    ("lines", "description"),
    ("menu_pages", "text"),
    ("posts", "text"),
    ("regions", "description"),
    ("regions", "rules"),
    ("sectors", "short_description"),
    ("sectors", "description"),
    ("sectors", "rules"),
    ("moderator_tasks", "description"),
    ("topo_images", "description"),
    ("map_markers", "description"),
)


def upgrade():
    connection = op.get_bind()
    for table_name, column_name in _WYSIWYG_HTML_COLUMNS:
        rows = connection.execute(
            sa.text(
                f"""
                SELECT id, {column_name} AS content
                FROM {table_name}
                WHERE {column_name} IS NOT NULL
                  AND (
                    {column_name} ~* '<h[1-6][[:space:]>]'
                    OR {column_name} ILIKE '%font-size%'
                    OR {column_name} ILIKE '%<font%'
                  )
                """
            )
        ).mappings()
        for row in rows:
            converted = replace_wysiwyg_headings_and_font_size(row["content"])
            if converted == row["content"]:
                continue
            connection.execute(
                sa.text(
                    f"""
                    UPDATE {table_name}
                    SET {column_name} = :content
                    WHERE id = :id
                    """
                ),
                {"content": converted, "id": row["id"]},
            )


def downgrade():
    pass
