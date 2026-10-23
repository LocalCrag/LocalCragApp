"""Move topo image tabu areas into their own table.

Revision ID: f3a9c2e71b04
Revises: c1f6b4e07a28
Create Date: 2026-10-23

Existing polygons are copied from ``topo_images.tabu_areas``. Their owner is
the superadmin when that user exists. The old JSON column is removed.
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "f3a9c2e71b04"
down_revision = "c1f6b4e07a28"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "tabu_areas",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("topo_image_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("path", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("order_index", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("time_created", sa.DateTime(), nullable=True),
        sa.Column("time_updated", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["topo_image_id"], ["topo_images.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("topo_image_id", "id"),
    )
    op.execute(
        sa.text(
            """
            INSERT INTO tabu_areas (id, topo_image_id, path, order_index, created_by_id, time_created)
            SELECT area_id, topo_image_id, area_path, order_index, superadmin_id, CURRENT_TIMESTAMP
            FROM (
                SELECT DISTINCT ON (topo_images.id, elem->>'id')
                    elem->>'id' AS area_id,
                    topo_images.id AS topo_image_id,
                    COALESCE(elem->'path', elem->'points') AS area_path,
                    (ordinality - 1)::integer AS order_index,
                    (
                        SELECT users.id
                        FROM users
                        WHERE users.superadmin IS TRUE
                        ORDER BY users.time_created ASC NULLS LAST
                        LIMIT 1
                    ) AS superadmin_id
                FROM topo_images
                CROSS JOIN LATERAL jsonb_array_elements(COALESCE(topo_images.tabu_areas, '[]'::json)::jsonb)
                    WITH ORDINALITY AS areas(elem, ordinality)
                WHERE jsonb_typeof(COALESCE(topo_images.tabu_areas, '[]'::json)::jsonb) = 'array'
                  AND elem->>'id' IS NOT NULL
                  AND char_length(elem->>'id') <= 64
                  AND COALESCE(elem->'path', elem->'points') IS NOT NULL
                ORDER BY topo_images.id, elem->>'id', ordinality
            ) AS copied
            """
        )
    )
    op.drop_column("topo_images", "tabu_areas")


def downgrade():
    op.add_column(
        "topo_images",
        sa.Column(
            "tabu_areas",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::json"),
        ),
    )
    op.execute(
        sa.text(
            """
            UPDATE topo_images
            SET tabu_areas = COALESCE(
                (
                    SELECT json_agg(
                        json_build_object('id', tabu_areas.id, 'path', tabu_areas.path)
                        ORDER BY tabu_areas.order_index
                    )
                    FROM tabu_areas
                    WHERE tabu_areas.topo_image_id = topo_images.id
                ),
                '[]'::json
            )
            """
        )
    )
    op.drop_table("tabu_areas")
