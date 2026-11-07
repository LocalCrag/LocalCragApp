"""Add file size and fill it from stored objects.

Revision ID: a7c3e1b94d20
Revises: f2b3c4d5e6a7
Create Date: 2026-11-06
"""

import logging

import sqlalchemy as sa
from alembic import op
from botocore.exceptions import BotoCoreError, ClientError

from uploader.file_storage import (
    object_sizes_in_bucket,
    object_storage_configured,
    stored_bytes_for_file,
)

revision = "a7c3e1b94d20"
down_revision = "f2b3c4d5e6a7"
branch_labels = None
depends_on = None

logger = logging.getLogger("alembic.runtime.migration")

_FILE_ROWS = sa.text(
    "SELECT id, filename, thumbnail_xs, thumbnail_s, thumbnail_m, thumbnail_l, thumbnail_xl FROM files"
)
_UPDATE_SIZE = sa.text("UPDATE files SET file_size = :file_size WHERE id = :id")


def upgrade():
    op.add_column("files", sa.Column("file_size", sa.BigInteger(), nullable=False, server_default="0"))
    if not object_storage_configured():
        return
    try:
        sizes = object_sizes_in_bucket()
    except (BotoCoreError, ClientError):
        logger.exception("Skipping file size backfill because object storage could not be listed.")
        return

    connection = op.get_bind()
    for row in connection.execute(_FILE_ROWS).mappings():
        file_size = stored_bytes_for_file(sizes, row["filename"], row)
        if file_size:
            connection.execute(_UPDATE_SIZE, {"file_size": file_size, "id": row["id"]})


def downgrade():
    op.drop_column("files", "file_size")
