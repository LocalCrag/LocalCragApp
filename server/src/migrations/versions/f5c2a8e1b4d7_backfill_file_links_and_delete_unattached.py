"""Backfill rich-text file links and delete unattached file rows.

Revision ID: f5c2a8e1b4d7
Revises: e1b7c4a90d32
Create Date: 2026-09-27

Existing rich text embeds image URLs. This creates a file_links row for each
stored filename found there, then deletes file rows that no foreign key and no
link reference and that are at least a day old. Storage objects for the deleted
rows are removed as well. Downgrade drops the links and cannot restore deleted
files.
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

from uploader.file_storage import delete_storage_keys, storage_keys_for_deleted_file
from util.file_links import backfill_file_links, delete_unattached_file_rows

revision = "f5c2a8e1b4d7"
down_revision = "e1b7c4a90d32"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "file_links",
        sa.Column("id", postgresql.UUID(), nullable=False),
        sa.Column("file_id", postgresql.UUID(), nullable=False),
        sa.Column("object_type", sa.Unicode(length=255), nullable=False),
        sa.Column("object_id", postgresql.UUID(), nullable=False),
        sa.Column("field_name", sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(["file_id"], ["files.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "file_id",
            "object_type",
            "object_id",
            "field_name",
            name="uq_file_links_reference",
        ),
    )
    op.create_index("ix_file_links_object", "file_links", ["object_type", "object_id"])

    bind = op.get_bind()
    backfill_file_links(bind)
    filenames = delete_unattached_file_rows(bind)
    keys = []
    for filename in filenames:
        keys.extend(storage_keys_for_deleted_file(filename))
    delete_storage_keys(keys)


def downgrade():
    op.drop_index("ix_file_links_object", table_name="file_links")
    op.drop_table("file_links")
