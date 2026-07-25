"""Add rules_title/rules_updated_at to regions, crags, sectors and create rules_read_status table

Revision ID: b3c5d7e9f1a2
Revises: a2b3c4d5e6f7
Create Date: 2026-07-24 14:00:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = "b3c5d7e9f1a2"
down_revision = "a2b3c4d5e6f7"
branch_labels = None
depends_on = None


def upgrade():
    for table_name in ("regions", "crags", "sectors"):
        with op.batch_alter_table(table_name, schema=None) as batch_op:
            batch_op.add_column(sa.Column("rules_title", sa.String(length=255), nullable=True))
            batch_op.add_column(sa.Column("rules_updated_at", sa.DateTime(), nullable=True))

    op.create_table(
        "rules_read_status",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("user_id", UUID(), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", UUID(), nullable=False),
        sa.Column("read_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_rules_read_status_user_id"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rules_read_status")),
        sa.UniqueConstraint("user_id", "entity_type", "entity_id", name="uq_rules_read_status_user_entity"),
    )
    with op.batch_alter_table("rules_read_status", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_rules_read_status_user_id"), ["user_id"], unique=False)


def downgrade():
    with op.batch_alter_table("rules_read_status", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_rules_read_status_user_id"))
    op.drop_table("rules_read_status")

    for table_name in ("regions", "crags", "sectors"):
        with op.batch_alter_table(table_name, schema=None) as batch_op:
            batch_op.drop_column("rules_updated_at")
            batch_op.drop_column("rules_title")
