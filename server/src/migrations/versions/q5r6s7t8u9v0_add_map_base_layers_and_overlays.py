"""Add map_base_layers, rename overlays, migrate MapTiler key into style URLs

Revision ID: q5r6s7t8u9v0
Revises: p4q5r6s7t8u9
Create Date: 2026-08-14 22:10:00.000000

"""

import json

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = "q5r6s7t8u9v0"
down_revision = "p4q5r6s7t8u9"
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
        batch_op.alter_column(
            "rock_explorer_map_layers",
            new_column_name="map_overlays",
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
        batch_op.alter_column(
            "map_overlays",
            new_column_name="rock_explorer_map_layers",
        )
        batch_op.drop_column("map_base_layers")
