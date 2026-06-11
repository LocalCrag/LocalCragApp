"""Backfill closure schedules from persisted closed flags.

Revision ID: d6e8f0a2b4c3
Revises: a2b4c6d8e0f1
Create Date: 2026-06-04

The legacy schema cascaded ``closed`` / ``closed_reason`` to every descendant when
a parent was closed. Schedules must only be created for entities that truly owned
the closure:

* A child keeps an owned closure only when its parent was **not** closed.
* A parent keeps an owned closure only when **every** descendant was closed.

After inserting schedules for those owned closures, ``closed`` flags are
re-materialized top-down so descendants inherit from the nearest scheduled ancestor.
"""

import sqlalchemy as sa
from alembic import op

revision = "d6e8f0a2b4c3"
down_revision = "a2b4c6d8e0f1"
branch_labels = None
depends_on = None


def _fetch_rows(connection, table, extra_columns=()):
    columns = ("id", "closed", "closed_reason", *extra_columns)
    rows = connection.execute(sa.text(f"SELECT {', '.join(columns)} FROM {table}")).fetchall()
    return {
        row[0]: {
            "closed": bool(row[1]),
            "closed_reason": row[2],
            **{column: row[3 + index] for index, column in enumerate(extra_columns)},
        }
        for row in rows
    }


def _lines_by_area(lines):
    grouped = {}
    for line_id, line in lines.items():
        grouped.setdefault(line["area_id"], []).append(line_id)
    return grouped


def _areas_by_sector(areas):
    grouped = {}
    for area_id, area in areas.items():
        grouped.setdefault(area["sector_id"], []).append(area_id)
    return grouped


def _sectors_by_crag(sectors):
    grouped = {}
    for sector_id, sector in sectors.items():
        grouped.setdefault(sector["crag_id"], []).append(sector_id)
    return grouped


def _all_lines_closed(lines, line_ids):
    if not line_ids:
        return True
    return all(lines[line_id]["closed"] for line_id in line_ids)


def _all_sector_descendants_closed(sector_id, areas, lines, areas_by_sector, lines_by_area):
    sector_areas = areas_by_sector.get(sector_id, [])
    if not sector_areas:
        return True
    return all(
        areas[area_id]["closed"] and _all_lines_closed(lines, lines_by_area.get(area_id, []))
        for area_id in sector_areas
    )


def _all_crag_descendants_closed(crag_id, sectors, areas, lines, sectors_by_crag, areas_by_sector, lines_by_area):
    crag_sectors = sectors_by_crag.get(crag_id, [])
    if not crag_sectors:
        return True
    return all(
        sectors[sector_id]["closed"]
        and _all_sector_descendants_closed(sector_id, areas, lines, areas_by_sector, lines_by_area)
        for sector_id in crag_sectors
    )


def _compute_own_closures(lines, areas, sectors, crags):
    lines_by_area = _lines_by_area(lines)
    areas_by_sector = _areas_by_sector(areas)
    sectors_by_crag = _sectors_by_crag(sectors)

    own_lines = set()
    own_areas = set()
    own_sectors = set()
    own_crags = set()

    for line_id, line in lines.items():
        if line["closed"] and not areas[line["area_id"]]["closed"]:
            own_lines.add(line_id)

    for area_id, area in areas.items():
        if not area["closed"] or sectors[area["sector_id"]]["closed"]:
            continue
        if _all_lines_closed(lines, lines_by_area.get(area_id, [])):
            own_areas.add(area_id)

    for sector_id, sector in sectors.items():
        if not sector["closed"] or crags[sector["crag_id"]]["closed"]:
            continue
        if _all_sector_descendants_closed(sector_id, areas, lines, areas_by_sector, lines_by_area):
            own_sectors.add(sector_id)

    for crag_id, crag in crags.items():
        if not crag["closed"]:
            continue
        if _all_crag_descendants_closed(
            crag_id, sectors, areas, lines, sectors_by_crag, areas_by_sector, lines_by_area
        ):
            own_crags.add(crag_id)

    return own_lines, own_areas, own_sectors, own_crags


def _insert_schedule(connection, fk_column, entity_id, reason):
    connection.execute(
        sa.text(
            f"""
            INSERT INTO closure_schedules
            (id, schedule_type, reason, {fk_column}, time_created)
            VALUES (gen_random_uuid(), 'PERMANENT', :reason, :entity_id, CURRENT_TIMESTAMP)
            """
        ),
        {"reason": reason, "entity_id": entity_id},
    )


def _materialize_closures(connection, own_lines, own_areas, own_sectors, own_crags, snapshot):
    lines, areas, sectors, crags = snapshot
    lines_by_area = _lines_by_area(lines)
    areas_by_sector = _areas_by_sector(areas)
    sectors_by_crag = _sectors_by_crag(sectors)

    connection.execute(sa.text("UPDATE lines SET closed = FALSE, closed_reason = NULL"))
    connection.execute(sa.text("UPDATE areas SET closed = FALSE, closed_reason = NULL"))
    connection.execute(sa.text("UPDATE sectors SET closed = FALSE, closed_reason = NULL"))
    connection.execute(sa.text("UPDATE crags SET closed = FALSE, closed_reason = NULL"))

    for crag_id, crag in crags.items():
        crag_closed = crag_id in own_crags
        crag_reason = crag["closed_reason"] if crag_closed else None
        connection.execute(
            sa.text("UPDATE crags SET closed = :closed, closed_reason = :reason WHERE id = :id"),
            {"closed": crag_closed, "reason": crag_reason, "id": crag_id},
        )

        for sector_id in sectors_by_crag.get(crag_id, []):
            sector = sectors[sector_id]
            sector_own = sector_id in own_sectors
            sector_closed = sector_own or crag_closed
            sector_reason = sector["closed_reason"] if sector_own else crag_reason if crag_closed else None
            connection.execute(
                sa.text("UPDATE sectors SET closed = :closed, closed_reason = :reason WHERE id = :id"),
                {"closed": sector_closed, "reason": sector_reason, "id": sector_id},
            )

            for area_id in areas_by_sector.get(sector_id, []):
                area = areas[area_id]
                area_own = area_id in own_areas
                area_closed = area_own or sector_closed
                area_reason = area["closed_reason"] if area_own else sector_reason if sector_closed else None
                connection.execute(
                    sa.text("UPDATE areas SET closed = :closed, closed_reason = :reason WHERE id = :id"),
                    {"closed": area_closed, "reason": area_reason, "id": area_id},
                )

                for line_id in lines_by_area.get(area_id, []):
                    line = lines[line_id]
                    line_own = line_id in own_lines
                    line_closed = line_own or area_closed
                    line_reason = line["closed_reason"] if line_own else area_reason if area_closed else None
                    connection.execute(
                        sa.text("UPDATE lines SET closed = :closed, closed_reason = :reason WHERE id = :id"),
                        {"closed": line_closed, "reason": line_reason, "id": line_id},
                    )


def upgrade():
    connection = op.get_bind()

    lines = _fetch_rows(connection, "lines", ("area_id",))
    areas = _fetch_rows(connection, "areas", ("sector_id",))
    sectors = _fetch_rows(connection, "sectors", ("crag_id",))
    crags = _fetch_rows(connection, "crags")

    snapshot = (lines, areas, sectors, crags)
    own_lines, own_areas, own_sectors, own_crags = _compute_own_closures(lines, areas, sectors, crags)

    for line_id in own_lines:
        _insert_schedule(connection, "line_id", line_id, lines[line_id]["closed_reason"])
    for area_id in own_areas:
        _insert_schedule(connection, "area_id", area_id, areas[area_id]["closed_reason"])
    for sector_id in own_sectors:
        _insert_schedule(connection, "sector_id", sector_id, sectors[sector_id]["closed_reason"])
    for crag_id in own_crags:
        _insert_schedule(connection, "crag_id", crag_id, crags[crag_id]["closed_reason"])

    _materialize_closures(connection, own_lines, own_areas, own_sectors, own_crags, snapshot)


def downgrade():
    op.execute(sa.text("DELETE FROM closure_schedules"))
