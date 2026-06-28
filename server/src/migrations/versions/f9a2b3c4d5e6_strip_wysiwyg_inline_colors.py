"""Strip inline colors from WYSIWYG HTML fields.

Revision ID: f9a2b3c4d5e6
Revises: e8a1b2c3d4f5
Create Date: 2026-06-25

"""

import re

import sqlalchemy as sa
from alembic import op

from util.html_inline_styles import strip_wysiwyg_inline_colors

revision = "f9a2b3c4d5e6"
down_revision = "e8a1b2c3d4f5"
branch_labels = None
depends_on = None

# (table, column) pairs edited via p-editor / Quill in the client.
_WYSIWYG_HTML_TARGETS = (
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

_WYSIWYG_COLOR_HINT_RE = re.compile(
    r"color\s*:|background-color\s*:|(?:^|\s)color\s*=\s*['\"]|</font>|<font\b",
    re.IGNORECASE,
)


def _html_may_contain_wysiwyg_colors(html: str | None) -> bool:
    if not html:
        return False
    return _WYSIWYG_COLOR_HINT_RE.search(html) is not None


def upgrade():
    connection = op.get_bind()

    for table_name, column_name in _WYSIWYG_HTML_TARGETS:
        rows = connection.execute(
            sa.text(
                f"""
                SELECT id, {column_name} AS content
                FROM {table_name}
                WHERE {column_name} IS NOT NULL
                  AND (
                    {column_name} ILIKE '%color:%'
                    OR {column_name} ILIKE '%background-color:%'
                    OR {column_name} ILIKE '% color=%'
                    OR {column_name} ILIKE '%<font%'
                  )
                """
            )
        ).mappings()

        for row in rows:
            original = row["content"]
            if not _html_may_contain_wysiwyg_colors(original):
                continue
            cleaned = strip_wysiwyg_inline_colors(original)
            if cleaned == original:
                continue
            connection.execute(
                sa.text(
                    f"""
                    UPDATE {table_name}
                    SET {column_name} = :content
                    WHERE id = :id
                    """
                ),
                {"content": cleaned, "id": row["id"]},
            )


def downgrade():
    pass
