"""Add secret topo entities registry; drop all denormalized secret columns.

Revision ID: c4e8f1a2b3d4
Revises: f7e8d9c0b1a2
Create Date: 2026-06-23 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = "c4e8f1a2b3d4"
down_revision = "f7e8d9c0b1a2"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "secret_topo_entities",
        sa.Column("entity_id", UUID(), nullable=False),
        sa.Column("entity_type", sa.String(length=32), nullable=False),
        sa.PrimaryKeyConstraint("entity_id"),
    )

    op.execute(
        """
        INSERT INTO secret_topo_entities (entity_id, entity_type)
        SELECT id, 'Crag' FROM crags WHERE secret IS TRUE
        UNION ALL
        SELECT id, 'Sector' FROM sectors WHERE secret IS TRUE
        UNION ALL
        SELECT id, 'Area' FROM areas WHERE secret IS TRUE
        UNION ALL
        SELECT id, 'Line' FROM lines WHERE secret IS TRUE
        """
    )

    with op.batch_alter_table("tags", schema=None) as batch_op:
        batch_op.drop_column("secret")

    with op.batch_alter_table("searchables", schema=None) as batch_op:
        batch_op.drop_column("secret")

    with op.batch_alter_table("crags", schema=None) as batch_op:
        batch_op.drop_column("secret")

    with op.batch_alter_table("sectors", schema=None) as batch_op:
        batch_op.drop_column("secret")

    with op.batch_alter_table("areas", schema=None) as batch_op:
        batch_op.drop_column("secret")

    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.drop_column("secret")


def downgrade():
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("secret", sa.Boolean(), nullable=True, server_default="0"))

    with op.batch_alter_table("areas", schema=None) as batch_op:
        batch_op.add_column(sa.Column("secret", sa.Boolean(), nullable=True, server_default="0"))

    with op.batch_alter_table("sectors", schema=None) as batch_op:
        batch_op.add_column(sa.Column("secret", sa.Boolean(), nullable=True, server_default="0"))

    with op.batch_alter_table("crags", schema=None) as batch_op:
        batch_op.add_column(sa.Column("secret", sa.Boolean(), nullable=True, server_default="0"))

    op.execute(
        """
        UPDATE lines l SET secret = TRUE
        FROM secret_topo_entities ste WHERE l.id = ste.entity_id
        """
    )
    op.execute(
        """
        UPDATE areas a SET secret = TRUE
        FROM secret_topo_entities ste WHERE a.id = ste.entity_id
        """
    )
    op.execute(
        """
        UPDATE sectors s SET secret = TRUE
        FROM secret_topo_entities ste WHERE s.id = ste.entity_id
        """
    )
    op.execute(
        """
        UPDATE crags c SET secret = TRUE
        FROM secret_topo_entities ste WHERE c.id = ste.entity_id
        """
    )

    with op.batch_alter_table("searchables", schema=None) as batch_op:
        batch_op.add_column(sa.Column("secret", sa.Boolean(), server_default="0", nullable=True))

    with op.batch_alter_table("tags", schema=None) as batch_op:
        batch_op.add_column(sa.Column("secret", sa.Boolean(), server_default="0", nullable=True))

    op.execute(
        """
        UPDATE searchables s
        SET secret = TRUE
        FROM secret_topo_entities ste
        WHERE s.id = ste.entity_id
        """
    )

    op.execute(
        """
        UPDATE tags t
        SET secret = TRUE
        FROM secret_topo_entities ste
        WHERE t.object_id = ste.entity_id
          AND t.object_type IN ('Crag', 'Sector', 'Area', 'Line')
        """
    )

    op.drop_table("secret_topo_entities")
