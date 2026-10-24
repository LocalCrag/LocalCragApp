"""Replace the archived flag with a publication status.

Revision ID: c1f6b4e07a28
Revises: b9d4f2c85e16
Create Date: 2026-10-21

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c1f6b4e07a28"
down_revision = "b9d4f2c85e16"
branch_labels = None
depends_on = None

publication_status = postgresql.ENUM(
    "published",
    "draft",
    "rejected",
    "archived",
    name="publicationstatusenum",
    create_type=False,
)


def upgrade():
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE publicationstatusenum ADD VALUE IF NOT EXISTS 'archived'")

    op.execute(
        "UPDATE lines SET publication_status = 'archived' "
        "WHERE archived IS TRUE AND publication_status = 'published'"
    )
    op.execute(
        "UPDATE lines SET publication_status = 'rejected' " "WHERE archived IS TRUE AND publication_status = 'draft'"
    )
    op.execute(
        "UPDATE topo_images SET publication_status = 'archived' "
        "WHERE archived IS TRUE AND publication_status = 'published'"
    )
    op.execute(
        "UPDATE topo_images SET publication_status = 'rejected' "
        "WHERE archived IS TRUE AND publication_status = 'draft'"
    )
    op.execute(
        "DELETE FROM searchables WHERE type = 'LINE' AND id IN "
        "(SELECT id FROM lines WHERE publication_status = 'archived')"
    )
    op.drop_column("lines", "archived")
    op.drop_column("topo_images", "archived")

    for table in ("areas", "sectors", "crags"):
        op.add_column(
            table,
            sa.Column(
                "publication_status",
                publication_status,
                server_default="published",
                nullable=False,
            ),
        )


def downgrade():
    op.add_column("lines", sa.Column("archived", sa.Boolean(), server_default="false", nullable=False))
    op.add_column("topo_images", sa.Column("archived", sa.Boolean(), server_default="false", nullable=False))
    op.execute("UPDATE lines SET archived = true WHERE publication_status = 'archived'")
    op.execute("UPDATE topo_images SET archived = true WHERE publication_status = 'archived'")
    op.execute("UPDATE lines SET publication_status = 'published' WHERE publication_status = 'archived'")
    op.execute("UPDATE topo_images SET publication_status = 'published' WHERE publication_status = 'archived'")
    for table in ("areas", "sectors", "crags"):
        op.drop_column(table, "publication_status")
