"""Release note bundles, items, notification type, instance/account flags.

Single revision: final schema (no translation_key / sort_order on items;
instance_launched_at on instance_settings).

Revision ID: c9e2a1b0d3f4
Revises: 128e1bc574bc
Create Date: 2026-05-10

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c9e2a1b0d3f4"
down_revision = "128e1bc574bc"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TYPE notificationtypeenum ADD VALUE 'release_notes'")

    op.add_column(
        "instance_settings",
        sa.Column("instance_launched_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "instance_settings",
        sa.Column("release_notes_catalog_seeded", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.execute("UPDATE instance_settings SET instance_launched_at = NOW() WHERE instance_launched_at IS NULL")

    op.add_column(
        "account_settings",
        sa.Column("release_notes_notifications_enabled", sa.Boolean(), nullable=False, server_default="true"),
    )

    op.create_table(
        "release_note_bundles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("time_created", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id"),
    )
    op.create_table(
        "release_note_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("item_key", sa.String(length=120), nullable=False),
        sa.Column("note_type", sa.String(length=40), nullable=False),
        sa.Column("bundle_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["bundle_id"], ["release_note_bundles.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id"),
        sa.UniqueConstraint("item_key"),
    )
    with op.batch_alter_table("release_note_items", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_release_note_items_bundle_id"), ["bundle_id"], unique=False)


def downgrade():
    with op.batch_alter_table("release_note_items", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_release_note_items_bundle_id"))

    op.drop_table("release_note_items")
    op.drop_table("release_note_bundles")

    op.drop_column("account_settings", "release_notes_notifications_enabled")
    op.drop_column("instance_settings", "release_notes_catalog_seeded")
    op.drop_column("instance_settings", "instance_launched_at")
