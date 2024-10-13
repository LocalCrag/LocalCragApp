import uuid

import sqlalchemy as sa
from alembic import op
from sqlalchemy.sql import table, column

# revision identifiers, used by Alembic.
revision = "758908a7d7b8"
down_revision = "b90c345afbd0"
branch_labels = None
depends_on = None


def upgrade():
    # Reflect the crags, sectors, areas, topo_images, and map_markers tables
    crags = table("crags", column("id", sa.UUID), column("lat", sa.Float), column("lng", sa.Float))

    sectors = table("sectors", column("id", sa.UUID), column("lat", sa.Float), column("lng", sa.Float))

    areas = table("areas", column("id", sa.UUID), column("lat", sa.Float), column("lng", sa.Float))

    topo_images = table("topo_images", column("id", sa.UUID), column("lat", sa.Float), column("lng", sa.Float))

    map_markers = table(
        "map_markers",
        column("id", sa.UUID),
        column("lat", sa.Float),
        column("lng", sa.Float),
        column("crag_id", sa.UUID),
        column("sector_id", sa.UUID),
        column("area_id", sa.UUID),
        column("topo_image_id", sa.UUID),
        column(
            "type",
            sa.Enum("TOPO_IMAGE", "AREA", "SECTOR", "CRAG", "PARKING", "ACCESS_POINT", "OTHER", name="mapmarkertype"),
        ),
    )

    connection = op.get_bind()

    # Helper function to create map markers
    def create_map_markers(table, type_):
        objects_with_coords = connection.execute(
            sa.select(table.c.id, table.c.lat, table.c.lng)
            .where(table.c.lat.isnot(None))
            .where(table.c.lng.isnot(None))
        ).fetchall()

        for obj in objects_with_coords:
            if obj.lat is None or obj.lng is None:
                continue
            connection.execute(
                map_markers.insert().values(
                    id=uuid.uuid4(),
                    lat=obj.lat,
                    lng=obj.lng,
                    type=type_,
                    crag_id=obj.id if type_ == "CRAG" else None,
                    sector_id=obj.id if type_ == "SECTOR" else None,
                    area_id=obj.id if type_ == "AREA" else None,
                    topo_image_id=obj.id if type_ == "TOPO_IMAGE" else None,
                )
            )

    # Create MapMarker objects for each Crag, Sector, Area, and TopoImage
    create_map_markers(crags, "CRAG")
    create_map_markers(sectors, "SECTOR")
    create_map_markers(areas, "AREA")
    create_map_markers(topo_images, "TOPO_IMAGE")


def downgrade():
    pass
