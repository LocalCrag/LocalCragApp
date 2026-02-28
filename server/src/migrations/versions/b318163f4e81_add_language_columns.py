"""add language to instance_settings and account_settings, backfill existing to 'de'

Revision ID: aa_add_language_columns
Revises:
Create Date: 2025-12-07

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b318163f4e81"
down_revision = "14dc45b4214e"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("instance_settings", sa.Column("language", sa.String(length=10), nullable=False, server_default="en"))
    op.add_column("account_settings", sa.Column("language", sa.String(length=10), nullable=False, server_default="en"))

    # set existing rows to 'de' to keep current behavior
    op.execute("UPDATE instance_settings SET language='de' WHERE language IS NULL OR language='' ")
    op.execute("UPDATE account_settings SET language='de' WHERE language IS NULL OR language='' ")

    op.drop_column("users", "language")


def downgrade():
    op.drop_column("account_settings", "language")
    op.drop_column("instance_settings", "language")
