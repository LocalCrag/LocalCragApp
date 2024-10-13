"""empty message

Revision ID: 04cd54785ed2
Revises: d0f895ce16d0
Create Date: 2024-09-28 22:43:44.112752

"""
from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = '04cd54785ed2'
down_revision = 'd0f895ce16d0'
branch_labels = None
depends_on = None


def upgrade():
    """
    Some lines have been manually assigned to another area. This messed up the ascents table. We have to iterate though
    all ascents and fix area, sector and crag ids by traversing the tree via the line.
    """
    conn = op.get_bind()
    ascents = conn.execute(text('SELECT line_id, id FROM ascents')).fetchall()
    for ascent in ascents:
        line_id = ascent[0]
        line = conn.execute(text('SELECT area_id FROM lines WHERE id = :line_id'), {'line_id': line_id}).fetchone()
        area_id = line[0]
        area = conn.execute(text('SELECT sector_id FROM areas WHERE id = :area_id'), {'area_id': area_id}).fetchone()
        sector_id = area[0]
        sector = conn.execute(text('SELECT crag_id FROM sectors WHERE id = :sector_id'),
                              {'sector_id': sector_id}).fetchone()
        crag_id = sector[0]
        conn.execute(text(
            'UPDATE ascents SET area_id = :area_id, sector_id = :sector_id, crag_id = :crag_id WHERE id = :ascent_id'),
                     {'area_id': area_id, 'sector_id': sector_id, 'crag_id': crag_id, 'ascent_id': ascent[1]})


def downgrade():
    pass
