"""Delete storage objects that no files row references.

Revision ID: e1b7c4a90d32
Revises: w2x3y4z5a6b7
Create Date: 2026-09-27

File rows used to be removed without deleting the original image or its
thumbnails. This revision lists the bucket and deletes keys that are not the
stored filename or a thumbnail still marked on a files row. Downgrade cannot
restore deleted objects.
"""

import sqlalchemy as sa
from alembic import op

from uploader.file_storage import (
    delete_unreferenced_storage_objects,
    referenced_storage_keys,
)

revision = "e1b7c4a90d32"
down_revision = "w2x3y4z5a6b7"
branch_labels = None
depends_on = None

_FILE_STORAGE_COLUMNS = sa.text(
    "SELECT filename, thumbnail_xs, thumbnail_s, thumbnail_m, thumbnail_l, thumbnail_xl FROM files"
)


def upgrade():
    rows = op.get_bind().execute(_FILE_STORAGE_COLUMNS).mappings()
    delete_unreferenced_storage_objects(referenced_storage_keys(rows))


def downgrade():
    pass
