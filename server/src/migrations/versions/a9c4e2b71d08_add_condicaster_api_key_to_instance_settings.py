"""Store the CondiCaster API key on instance settings.

Revision ID: a9c4e2b71d08
Revises: e3b7c9a41d55
Create Date: 2026-11-22 19:10:00.000000

"""

import os

import sqlalchemy as sa
from alembic import op

revision = "a9c4e2b71d08"
down_revision = "e3b7c9a41d55"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("condicaster_api_key", sa.String(length=512), nullable=True))

    # One-time copy for installs that still export the old environment variable.
    key = (os.environ.get("CONDICASTER_API_KEY") or "").strip()
    if key:
        op.execute(
            sa.text(
                "UPDATE instance_settings SET condicaster_api_key = :key WHERE condicaster_api_key IS NULL"
            ).bindparams(key=key[:512])
        )


def downgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_column("condicaster_api_key")
