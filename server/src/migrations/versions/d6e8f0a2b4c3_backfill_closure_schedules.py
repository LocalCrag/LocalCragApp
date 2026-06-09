"""Backfill closure schedules from persisted closed flags.

Revision ID: d6e8f0a2b4c3
Revises: a2b4c6d8e0f1
Create Date: 2026-06-04

"""

import sqlalchemy as sa
from alembic import op

revision = "d6e8f0a2b4c3"
down_revision = "a2b4c6d8e0f1"
branch_labels = None
depends_on = None


def upgrade():
    connection = op.get_bind()
    lines = connection.execute(sa.text("SELECT id, closed, closed_reason FROM lines WHERE closed = TRUE")).fetchall()
    for line_id, _, reason in lines:
        connection.execute(
            sa.text(
                """
                INSERT INTO closure_schedules
                (id, schedule_type, reason, line_id, time_created)
                VALUES (gen_random_uuid(), 'PERMANENT', :reason, :line_id, CURRENT_TIMESTAMP)
                """
            ),
            {"reason": reason, "line_id": line_id},
        )

    areas = connection.execute(
        sa.text(
            """
            SELECT a.id, a.closed, a.closed_reason,
                   BOOL_AND(l.closed) AS all_lines_closed,
                   COUNT(l.id) AS line_count
            FROM areas a
            LEFT JOIN lines l ON l.area_id = a.id
            WHERE a.closed = TRUE
            GROUP BY a.id, a.closed, a.closed_reason
            """
        )
    ).fetchall()
    for area_id, _, reason, all_lines_closed, line_count in areas:
        if line_count and not all_lines_closed:
            connection.execute(
                sa.text("UPDATE areas SET closed = FALSE, closed_reason = NULL WHERE id = :id"),
                {"id": area_id},
            )
            continue
        connection.execute(
            sa.text(
                """
                INSERT INTO closure_schedules
                (id, schedule_type, reason, area_id, time_created)
                VALUES (gen_random_uuid(), 'PERMANENT', :reason, :area_id, CURRENT_TIMESTAMP)
                """
            ),
            {"reason": reason, "area_id": area_id},
        )

    sectors = connection.execute(
        sa.text(
            """
            SELECT s.id, s.closed, s.closed_reason,
                   BOOL_AND(a.closed) AS all_areas_closed,
                   COUNT(a.id) AS area_count
            FROM sectors s
            LEFT JOIN areas a ON a.sector_id = s.id
            WHERE s.closed = TRUE
            GROUP BY s.id, s.closed, s.closed_reason
            """
        )
    ).fetchall()
    for sector_id, _, reason, all_areas_closed, area_count in sectors:
        if area_count and not all_areas_closed:
            connection.execute(
                sa.text("UPDATE sectors SET closed = FALSE, closed_reason = NULL WHERE id = :id"),
                {"id": sector_id},
            )
            continue
        connection.execute(
            sa.text(
                """
                INSERT INTO closure_schedules
                (id, schedule_type, reason, sector_id, time_created)
                VALUES (gen_random_uuid(), 'PERMANENT', :reason, :sector_id, CURRENT_TIMESTAMP)
                """
            ),
            {"reason": reason, "sector_id": sector_id},
        )

    crags = connection.execute(
        sa.text(
            """
            SELECT c.id, c.closed, c.closed_reason,
                   BOOL_AND(s.closed) AS all_sectors_closed,
                   COUNT(s.id) AS sector_count
            FROM crags c
            LEFT JOIN sectors s ON s.crag_id = c.id
            WHERE c.closed = TRUE
            GROUP BY c.id, c.closed, c.closed_reason
            """
        )
    ).fetchall()
    for crag_id, _, reason, all_sectors_closed, sector_count in crags:
        if sector_count and not all_sectors_closed:
            connection.execute(
                sa.text("UPDATE crags SET closed = FALSE, closed_reason = NULL WHERE id = :id"),
                {"id": crag_id},
            )
            continue
        connection.execute(
            sa.text(
                """
                INSERT INTO closure_schedules
                (id, schedule_type, reason, crag_id, time_created)
                VALUES (gen_random_uuid(), 'PERMANENT', :reason, :crag_id, CURRENT_TIMESTAMP)
                """
            ),
            {"reason": reason, "crag_id": crag_id},
        )


def downgrade():
    op.execute(sa.text("DELETE FROM closure_schedules"))
