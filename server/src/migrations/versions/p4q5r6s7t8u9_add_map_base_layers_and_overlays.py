"""Add map_base_layers and map_overlays; migrate MapTiler key into style URLs

Revision ID: p4q5r6s7t8u9
Revises: o3p4q5r6s7t8
Create Date: 2026-08-14 21:40:00.000000

"""

import json

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = "p4q5r6s7t8u9"
down_revision = "o3p4q5r6s7t8"
branch_labels = None
depends_on = None


def upgrade():
    empty_json = sa.text("'[]'::json")
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "map_base_layers",
                JSON(),
                nullable=False,
                server_default=empty_json,
            )
        )
        batch_op.add_column(
            sa.Column(
                "map_overlays",
                JSON(),
                nullable=False,
                server_default=empty_json,
            )
        )

    conn = op.get_bind()
    rows = conn.execute(text("SELECT id, maptiler_api_key FROM instance_settings")).mappings()
    for row in rows:
        key = (row["maptiler_api_key"] or "").strip()
        if not key:
            continue
        layers = [
            {
                "id": "maptiler-topo",
                "name": "Topo",
                "styleUrl": f"https://api.maptiler.com/maps/topo-v2/style.json?key={key}",
                "topoDefault": True,
                "rockExplorerDefault": True,
                "defaultOverlayIds": [],
            },
            {
                "id": "maptiler-satellite",
                "name": "Satellite",
                "styleUrl": f"https://api.maptiler.com/maps/satellite/style.json?key={key}",
                "topoDefault": False,
                "rockExplorerDefault": False,
                "defaultOverlayIds": [],
            },
        ]
        conn.execute(
            text("UPDATE instance_settings " "SET map_base_layers = CAST(:layers AS json) " "WHERE id = :id"),
            {"layers": json.dumps(layers), "id": row["id"]},
        )

    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_column("maptiler_api_key")


def downgrade():
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("maptiler_api_key", sa.String(length=120), nullable=True))
        batch_op.drop_column("map_base_layers")
        batch_op.drop_column("map_overlays")
