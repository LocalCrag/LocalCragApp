"""Populate account settings for existing users

Revision ID: 5f9d1e2c3b4a
Revises: 4b51ee0ab596
Create Date: 2025-11-24 22:30:00

"""

import uuid

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "5f9d1e2c3b4a"
down_revision = "4b51ee0ab596"
branch_labels = None
depends_on = None


def upgrade():  # pragma: no cover
    bind = op.get_bind()
    missing_rows = bind.execute(
        sa.text("SELECT u.id FROM users u LEFT JOIN account_settings a ON a.user_id = u.id WHERE a.user_id IS NULL")
    ).fetchall()
    if not missing_rows:
        return

    insert_stmt = sa.text(
        "INSERT INTO account_settings (id, user_id, comment_reply_mails_enabled) VALUES (:id, :user_id, true)"
    )
    for (user_id,) in missing_rows:
        bind.execute(insert_stmt, {"id": str(uuid.uuid4()), "user_id": user_id})


def downgrade():  # pragma: no cover
    pass
