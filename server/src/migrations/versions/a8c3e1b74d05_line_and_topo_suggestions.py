"""Line and topo image suggestions, plus the per-user permission table.

Revision ID: a8c3e1b74d05
Revises: f7a1c3e9b2d4
Create Date: 2026-10-21

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "a8c3e1b74d05"
down_revision = "f7a1c3e9b2d4"
branch_labels = None
depends_on = None


def upgrade():
    status = postgresql.ENUM("published", "draft", name="publicationstatusenum", create_type=False)
    status.create(op.get_bind(), checkfirst=True)
    effect = postgresql.ENUM("allow", "deny", name="permissioneffectenum", create_type=False)
    effect.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "lines",
        sa.Column("publication_status", status, server_default="published", nullable=False),
    )
    op.add_column(
        "topo_images",
        sa.Column("publication_status", status, server_default="published", nullable=False),
    )
    op.add_column(
        "instance_settings",
        sa.Column("suggestions_enabled", sa.Boolean(), server_default="true", nullable=False),
    )

    op.execute("ALTER TYPE notificationtypeenum ADD VALUE 'suggestion_submitted'")
    op.execute("ALTER TYPE notificationtypeenum ADD VALUE 'suggestion_published'")
    op.execute("ALTER TYPE notificationtypeenum ADD VALUE 'suggestion_rejected'")

    op.create_table(
        "permissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("time_created", sa.DateTime(), nullable=True),
        sa.Column("time_updated", sa.DateTime(), nullable=True),
        sa.Column("created_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("effect", effect, nullable=False),
        sa.Column("resource_type", sa.String(length=64), nullable=True),
        sa.Column("resource_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id"),
    )
    op.create_index("ix_permissions_user_id", "permissions", ["user_id"])
    op.create_index(
        "uq_permissions_global",
        "permissions",
        ["user_id", "key", "effect"],
        unique=True,
        postgresql_where=sa.text("resource_type IS NULL AND resource_id IS NULL"),
    )
    op.create_index(
        "uq_permissions_resource",
        "permissions",
        ["user_id", "key", "effect", "resource_type", "resource_id"],
        unique=True,
        postgresql_where=sa.text("resource_type IS NOT NULL AND resource_id IS NOT NULL"),
    )


def downgrade():
    op.drop_index("uq_permissions_resource", table_name="permissions")
    op.drop_index("uq_permissions_global", table_name="permissions")
    op.drop_index("ix_permissions_user_id", table_name="permissions")
    op.drop_table("permissions")
    op.drop_column("instance_settings", "suggestions_enabled")
    op.drop_column("topo_images", "publication_status")
    op.drop_column("lines", "publication_status")
    postgresql.ENUM(name="permissioneffectenum", create_type=False).drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="publicationstatusenum", create_type=False).drop(op.get_bind(), checkfirst=True)
