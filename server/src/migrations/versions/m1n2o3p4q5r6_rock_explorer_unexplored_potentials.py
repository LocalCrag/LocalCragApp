"""Replace UNEXPLORED potential with high/medium/low assumed variants.

Revision ID: m1n2o3p4q5r6
Revises: l0m1n2o3p4q5
Create Date: 2026-08-08 16:20:00.000000

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "m1n2o3p4q5r6"
down_revision = "l0m1n2o3p4q5"
branch_labels = None
depends_on = None

_NEW_VALUES = (
    "HIGH",
    "MEDIUM",
    "LOW",
    "NONE",
    "UNEXPLORED_HIGH",
    "UNEXPLORED_MEDIUM",
    "UNEXPLORED_LOW",
)

_OLD_VALUES = (
    "HIGH",
    "MEDIUM",
    "LOW",
    "NONE",
    "UNEXPLORED",
)


def upgrade():
    # Map legacy UNEXPLORED → UNEXPLORED_MEDIUM while recreating the enum type.
    op.execute("CREATE TYPE rockexplorerpotentialenum_new AS ENUM(" + ", ".join(f"'{v}'" for v in _NEW_VALUES) + ")")
    op.execute(
        """
        ALTER TABLE rock_explorer_features
        ALTER COLUMN potential TYPE rockexplorerpotentialenum_new
        USING (
            CASE potential::text
                WHEN 'UNEXPLORED' THEN 'UNEXPLORED_MEDIUM'
                ELSE potential::text
            END
        )::rockexplorerpotentialenum_new
        """
    )
    op.execute("DROP TYPE rockexplorerpotentialenum")
    op.execute("ALTER TYPE rockexplorerpotentialenum_new RENAME TO rockexplorerpotentialenum")


def downgrade():
    op.execute("CREATE TYPE rockexplorerpotentialenum_old AS ENUM(" + ", ".join(f"'{v}'" for v in _OLD_VALUES) + ")")
    op.execute(
        """
        ALTER TABLE rock_explorer_features
        ALTER COLUMN potential TYPE rockexplorerpotentialenum_old
        USING (
            CASE potential::text
                WHEN 'UNEXPLORED_HIGH' THEN 'UNEXPLORED'
                WHEN 'UNEXPLORED_MEDIUM' THEN 'UNEXPLORED'
                WHEN 'UNEXPLORED_LOW' THEN 'UNEXPLORED'
                ELSE potential::text
            END
        )::rockexplorerpotentialenum_old
        """
    )
    op.execute("DROP TYPE rockexplorerpotentialenum")
    op.execute("ALTER TYPE rockexplorerpotentialenum_old RENAME TO rockexplorerpotentialenum")
