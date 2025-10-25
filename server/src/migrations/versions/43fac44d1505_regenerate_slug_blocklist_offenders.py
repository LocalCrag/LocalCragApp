"""empty message

Revision ID: 43fac44d1505
Revises: 019f6bdbb573
Create Date: 2025-10-25 08:29:54.463210

"""

from migrations.util_scripts.regenerate_slug_blocklist_offenders import (
    regenerate_blocklisted_slugs,
)

# revision identifiers, used by Alembic.
revision = "43fac44d1505"
down_revision = "019f6bdbb573"
branch_labels = None
depends_on = None


def upgrade():
    regenerate_blocklisted_slugs()


def downgrade():
    pass
