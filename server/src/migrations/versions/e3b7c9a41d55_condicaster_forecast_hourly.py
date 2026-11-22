"""Replace BlocWeather URLs with cached CondiCaster crags.

Revision ID: e3b7c9a41d55
Revises: c6d1e8a42f90
Create Date: 2026-11-22 00:30:00.000000

"""

import sqlalchemy as sa
from alembic import op

revision = "e3b7c9a41d55"
down_revision = "c6d1e8a42f90"
branch_labels = None
depends_on = None


def upgrade():
    for table in ("areas", "crags", "sectors"):
        with op.batch_alter_table(table, schema=None) as batch_op:
            batch_op.drop_column("blocweather_url")
            batch_op.add_column(sa.Column("condicaster_crag_id", sa.Integer(), nullable=True))
            batch_op.add_column(sa.Column("condicaster_crag_name", sa.String(length=255), nullable=True))

    op.create_table(
        "condicaster_cache",
        sa.Column("condicaster_crag_id", sa.Integer(), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=True),
        sa.Column("current_condiscore", sa.Numeric(4, 2), nullable=True),
        sa.Column("current_valid_at", sa.DateTime(), nullable=True),
        sa.Column("hourly_date", sa.Date(), nullable=True),
        sa.Column("hourly_json", sa.JSON(), nullable=True),
        sa.Column("daily_json", sa.JSON(), nullable=True),
        sa.Column("hourly_fetched_at", sa.DateTime(), nullable=True),
        sa.Column("daily_fetched_at", sa.DateTime(), nullable=True),
        sa.Column("last_error", sa.String(length=32), nullable=True),
        sa.Column("forecast_hourly_fetched_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("condicaster_crag_id"),
    )


def downgrade():
    op.drop_table("condicaster_cache")
    for table in ("areas", "crags", "sectors"):
        with op.batch_alter_table(table, schema=None) as batch_op:
            batch_op.drop_column("condicaster_crag_name")
            batch_op.drop_column("condicaster_crag_id")
            batch_op.add_column(sa.Column("blocweather_url", sa.String(length=255), nullable=True))
