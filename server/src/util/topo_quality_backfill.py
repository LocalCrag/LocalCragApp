"""Assign current quality points to the creators of existing rows.

Used by the migration that introduces stored moderator scores. Later edits
go through the request listener instead of being recomputed.
"""

from __future__ import annotations

import sqlalchemy as sa

from util.topo_quality_score import (
    LineRecord,
    SpotRecord,
    TopoRecord,
    creator_points,
    fa_complete,
    has_text,
    has_video,
    is_styled,
)

_GPS_TYPE = {"crag": "CRAG", "sector": "SECTOR", "area": "AREA"}


def backfill_creator_points(connection) -> None:
    gym = bool(connection.execute(sa.text("SELECT gym_mode FROM instance_settings LIMIT 1")).scalar())
    drawn_ids = {row.id for row in connection.execute(sa.text("SELECT DISTINCT line_id AS id FROM line_paths"))}
    gps_topos = {
        row.id
        for row in connection.execute(
            sa.text(
                """
                SELECT DISTINCT topo_image_id AS id
                FROM map_markers
                WHERE topo_image_id IS NOT NULL AND lat IS NOT NULL AND lng IS NOT NULL
                """
            )
        )
    }
    spot_flags = _spot_flags(connection)

    spots = []
    spots.extend(_spots(connection, "crag", "crags", spot_flags))
    spots.extend(_spots(connection, "sector", "sectors", spot_flags))
    spots.extend(_spots(connection, "area", "areas", spot_flags))
    area_ids = {spot.id for spot in spots if spot.level == "area"}

    lines = []
    for row in connection.execute(
        sa.text(
            """
            SELECT id, name, area_id, created_by_id, time_created, description, videos,
                   publication_status, fa_name, fa_date, fa_year, routesetter, set_date,
                   roof, overhang, vertical, slab, traverse, dihedral, compression, arete, crack, dyno, mantle
            FROM lines
            WHERE publication_status = 'published'
            """
        )
    ).mappings():
        if str(row["area_id"]) not in area_ids:
            continue
        values = dict(row)
        lines.append(
            LineRecord(
                id=str(row["id"]),
                name=row["name"],
                slug="",
                area_id=str(row["area_id"]),
                crag_slug="",
                sector_slug="",
                area_slug="",
                created_by_id=str(row["created_by_id"]) if row["created_by_id"] else None,
                time_created=row["time_created"],
                published=True,
                drawn=row["id"] in drawn_ids,
                styled=is_styled(values),
                has_video=has_video(row["videos"]),
                fa_complete=fa_complete(values, gym),
                has_description=has_text(row["description"]),
            )
        )

    topos = []
    for row in connection.execute(
        sa.text(
            """
            SELECT id, title, area_id, created_by_id
            FROM topo_images
            WHERE publication_status = 'published'
            """
        )
    ).mappings():
        if str(row["area_id"]) not in area_ids:
            continue
        topos.append(
            TopoRecord(
                id=str(row["id"]),
                name=row["title"] or "",
                area_id=str(row["area_id"]),
                crag_slug="",
                sector_slug="",
                area_slug="",
                created_by_id=str(row["created_by_id"]) if row["created_by_id"] else None,
                published=True,
                has_gps=row["id"] in gps_topos,
            )
        )

    for user_id, points in creator_points(spots, lines, topos, gym).items():
        connection.execute(
            sa.text("UPDATE users SET topo_points = :points WHERE id = :user_id"),
            {"points": points, "user_id": user_id},
        )


def _spots(connection, level: str, table: str, flags: dict) -> list[SpotRecord]:
    rows = connection.execute(
        sa.text(
            f"""
            SELECT id, name, created_by_id, description, short_description, portrait_image_id
            FROM {table}
            WHERE publication_status = 'published'
            """
        )
    ).mappings()
    spots = []
    for row in rows:
        has_gps, has_parking = flags.get((level, row["id"]), (False, False))
        spots.append(
            SpotRecord(
                id=str(row["id"]),
                name=row["name"],
                slug="",
                level=level,
                parent_id=None,
                crag_slug="",
                sector_slug=None,
                area_slug=None,
                order_index=0,
                created_by_id=str(row["created_by_id"]) if row["created_by_id"] else None,
                published=True,
                has_gps=has_gps,
                has_parking=has_parking,
                has_description=has_text(row["description"]) or has_text(row["short_description"]),
                has_image=row["portrait_image_id"] is not None,
            )
        )
    return spots


def _spot_flags(connection) -> dict:
    flags = {}
    rows = connection.execute(
        sa.text(
            """
            SELECT crag_id, sector_id, area_id, type, lat, lng
            FROM map_markers
            WHERE lat IS NOT NULL AND lng IS NOT NULL
            """
        )
    ).mappings()
    for row in rows:
        marker_type = row["type"].value if hasattr(row["type"], "value") else row["type"]
        for level, fk in (("crag", "crag_id"), ("sector", "sector_id"), ("area", "area_id")):
            entity_id = row[fk]
            if entity_id is None:
                continue
            has_gps, has_parking = flags.get((level, entity_id), (False, False))
            if marker_type == _GPS_TYPE[level]:
                has_gps = True
            if marker_type == "PARKING":
                has_parking = True
            flags[(level, entity_id)] = (has_gps, has_parking)
    return flags
