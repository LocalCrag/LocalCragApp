"""Recalculate community grades without ungraded ascents.

Revision ID: f4a8c2e91b06
Revises: e8a1d4c67b32
Create Date: 2026-10-28

Ungraded ticks (grade value 0) used to count toward the stored user grade.
Recompute the lines that have one. Lines without an ungraded ascent are unchanged.
The previous means are not stored, so downgrade leaves the new values in place.
"""

revision = "f4a8c2e91b06"
down_revision = "e8a1d4c67b32"
branch_labels = None
depends_on = None


def upgrade():
    from migrations.util_scripts.calculate_user_grades import (
        recalculate_lines_with_ungraded_ascents,
    )

    recalculate_lines_with_ungraded_ascents()


def downgrade():
    pass
