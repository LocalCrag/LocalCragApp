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
    is_project_grade,
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

    crag_ids = _published_ids(connection, "crags")
    sector_ids = _published_ids(connection, "sectors", "crag_id", crag_ids)
    area_ids = _published_ids(connection, "areas", "sector_id", sector_ids)
    spots = []
    spots.extend(_spots(connection, "crag", "crags", spot_flags, crag_ids))
    spots.extend(_spots(connection, "sector", "sectors", spot_flags, sector_ids))
    spots.extend(_spots(connection, "area", "areas", spot_flags, area_ids))

    lines = []
    if area_ids:
        line_rows = connection.execute(
            sa.text(
                """
                SELECT id, name, area_id, created_by_id, time_created, description, videos,
                       publication_status, author_grade_value, fa_name, fa_date, fa_year, routesetter, set_date,
                       roof, overhang, vertical, slab, traverse, dihedral, compression, arete, crack, dyno, mantle
                FROM lines
                WHERE publication_status = 'published' AND area_id IN :area_ids
                """
            ).bindparams(sa.bindparam("area_ids", expanding=True)),
            {"area_ids": list(area_ids)},
        ).mappings()
    else:
        line_rows = []
    for row in line_rows:
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
                is_project=is_project_grade(row["author_grade_value"]),
            )
        )

    topos = []
    if area_ids:
        topo_rows = connection.execute(
            sa.text(
                """
                SELECT id, title, area_id, created_by_id
                FROM topo_images
                WHERE publication_status = 'published' AND area_id IN :area_ids
                """
            ).bindparams(sa.bindparam("area_ids", expanding=True)),
            {"area_ids": list(area_ids)},
        ).mappings()
    else:
        topo_rows = []
    for row in topo_rows:
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

    inspector = sa.inspect(connection)
    has_column = any(column["name"] == "topo_points" for column in inspector.get_columns("users"))
    has_events = inspector.has_table("topo_point_events")
    for user_id, points in creator_points(spots, lines, topos, gym).items():
        # The original migration still owns the column. Later databases keep the
        # same total as an opening-balance event, replaced on each backfill so
        # running it twice does not add the score again.
        if has_column:
            connection.execute(
                sa.text("UPDATE users SET topo_points = :points WHERE id = :user_id"),
                {"points": points, "user_id": user_id},
            )
        if has_events:
            connection.execute(
                sa.text(
                    """
                    DELETE FROM topo_point_events
                    WHERE user_id = :user_id AND opening_balance IS TRUE
                    """
                ),
                {"user_id": user_id},
            )
            if points:
                connection.execute(
                    sa.text(
                        """
                        INSERT INTO topo_point_events
                            (id, user_id, points, time_created, opening_balance)
                        VALUES (gen_random_uuid(), :user_id, :points, NOW(), TRUE)
                        """
                    ),
                    {"points": points, "user_id": user_id},
                )


def _published_ids(connection, table: str, parent_column: str | None = None, parent_ids=None) -> list:
    """Ids of published rows, optionally limited to parents that are themselves published."""
    if parent_column is not None and not parent_ids:
        return []
    sql = f"SELECT id FROM {table} WHERE publication_status = 'published'"
    if parent_column is None:
        rows = connection.execute(sa.text(sql))
    else:
        statement = sa.text(sql + f" AND {parent_column} IN :parent_ids").bindparams(
            sa.bindparam("parent_ids", expanding=True)
        )
        rows = connection.execute(statement, {"parent_ids": list(parent_ids)})
    return [row.id for row in rows]


def _spots(connection, level: str, table: str, flags: dict, only_ids) -> list[SpotRecord]:
    if not only_ids:
        return []
    rows = connection.execute(
        sa.text(
            f"""
            SELECT id, name, created_by_id, description, short_description, portrait_image_id
            FROM {table}
            WHERE id IN :ids
            """
        ).bindparams(sa.bindparam("ids", expanding=True)),
        {"ids": list(only_ids)},
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
