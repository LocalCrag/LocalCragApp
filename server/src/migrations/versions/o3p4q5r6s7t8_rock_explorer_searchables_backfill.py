"""Backfill searchables for titled published rock explorer features.

Revision ID: o3p4q5r6s7t8
Revises: n2o3p4q5r6s7
Create Date: 2026-08-08 16:46:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "o3p4q5r6s7t8"
down_revision = "n2o3p4q5r6s7"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        INSERT INTO searchables (id, type, name)
        SELECT id, 'ROCK_EXPLORER_FEATURE', title
        FROM rock_explorer_features
        WHERE status = 'published'
          AND title IS NOT NULL
          AND btrim(title) <> ''
        ON CONFLICT DO NOTHING
        """
    )


def downgrade():
    op.execute("DELETE FROM searchables WHERE type = 'ROCK_EXPLORER_FEATURE'")
