"""Add tabu areas to topo images; line paths store selected ids.

Revision ID: w2x3y4z5a6b7
Revises: v0w1x2y3z4a5
Create Date: 2026-09-11
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSON

revision = "w2x3y4z5a6b7"
down_revision = "v0w1x2y3z4a5"
branch_labels = None
depends_on = None


def upgrade():
    empty_json = sa.text("'[]'::json")
    with op.batch_alter_table("topo_images", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "tabu_areas",
                JSON(),
                nullable=False,
                server_default=empty_json,
            )
        )
    with op.batch_alter_table("line_paths", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "tabu_area_ids",
                JSON(),
                nullable=False,
                server_default=empty_json,
            )
        )


def downgrade():
    with op.batch_alter_table("line_paths", schema=None) as batch_op:
        batch_op.drop_column("tabu_area_ids")
    with op.batch_alter_table("topo_images", schema=None) as batch_op:
        batch_op.drop_column("tabu_areas")
