"""Add rock explorer features and clusters tables

Revision ID: c1d2e3f4a5b6
Revises: b3c5d7e9f1a2
Create Date: 2026-07-25 21:35:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM, JSON, UUID

# revision identifiers, used by Alembic.
revision = "c1d2e3f4a5b6"
down_revision = "b3c5d7e9f1a2"
branch_labels = None
depends_on = None


def upgrade():
    # Use postgresql.ENUM with create_type=False. sa.Enum(..., create_type=False) still
    # emits CREATE TYPE on op.create_table and fails with DuplicateObject.
    potential_enum = ENUM(
        "HIGH", "MEDIUM", "LOW", "NONE", "UNEXPLORED", name="rockexplorerpotentialenum", create_type=False
    )
    rock_quality_enum = ENUM("PRIME", "OK", "CHOSS", name="rockexplorerrockqualityenum", create_type=False)
    rock_type_enum = ENUM(
        "BASALT",
        "SANDSTONE",
        "LIMESTONE",
        "GRANITE",
        "GNEISS",
        name="rockexplorerrocktypeenum",
        create_type=False,
    )
    potential_enum.create(op.get_bind(), checkfirst=True)
    rock_quality_enum.create(op.get_bind(), checkfirst=True)
    rock_type_enum.create(op.get_bind(), checkfirst=True)

    # Reuse existing LineTypeEnum DB type if present
    line_type_enum = ENUM("BOULDER", "SPORT", "TRAD", name="linetypeenum", create_type=False)

    op.create_table(
        "rock_explorer_clusters",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("time_created", sa.DateTime(), nullable=True),
        sa.Column("time_updated", sa.DateTime(), nullable=True),
        sa.Column("created_by_id", UUID(), nullable=True),
        sa.Column("title", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("potential", potential_enum, nullable=True),
        sa.Column("rock_quality", rock_quality_enum, nullable=True),
        sa.Column("rock_type", rock_type_enum, nullable=True),
        sa.Column("grade_line_type", line_type_enum, nullable=True),
        sa.Column("grade_scale", sa.String(length=32), nullable=True),
        sa.Column("grade_value_min", sa.Integer(), nullable=True),
        sa.Column("grade_value_max", sa.Integer(), nullable=True),
        sa.Column("access_issues", JSON(), nullable=False),
        sa.Column("crag_id", UUID(), nullable=True),
        sa.Column("sector_id", UUID(), nullable=True),
        sa.Column("area_id", UUID(), nullable=True),
        sa.Column("line_id", UUID(), nullable=True),
        sa.ForeignKeyConstraint(["area_id"], ["areas.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["crag_id"], ["crags.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["line_id"], ["lines.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["sector_id"], ["sectors.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rock_explorer_clusters")),
        sa.UniqueConstraint("id"),
    )

    op.create_table(
        "rock_explorer_features",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("time_created", sa.DateTime(), nullable=True),
        sa.Column("time_updated", sa.DateTime(), nullable=True),
        sa.Column("created_by_id", UUID(), nullable=True),
        sa.Column("title", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("potential", potential_enum, nullable=True),
        sa.Column("rock_quality", rock_quality_enum, nullable=True),
        sa.Column("rock_type", rock_type_enum, nullable=True),
        sa.Column("grade_line_type", line_type_enum, nullable=True),
        sa.Column("grade_scale", sa.String(length=32), nullable=True),
        sa.Column("grade_value_min", sa.Integer(), nullable=True),
        sa.Column("grade_value_max", sa.Integer(), nullable=True),
        sa.Column("access_issues", JSON(), nullable=False),
        sa.Column("geometry", JSON(), nullable=False),
        sa.Column("cluster_id", UUID(), nullable=True),
        sa.Column("crag_id", UUID(), nullable=True),
        sa.Column("sector_id", UUID(), nullable=True),
        sa.Column("area_id", UUID(), nullable=True),
        sa.Column("line_id", UUID(), nullable=True),
        sa.ForeignKeyConstraint(["area_id"], ["areas.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["cluster_id"], ["rock_explorer_clusters.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["crag_id"], ["crags.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["line_id"], ["lines.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["sector_id"], ["sectors.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rock_explorer_features")),
        sa.UniqueConstraint("id"),
    )
    with op.batch_alter_table("rock_explorer_features", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_rock_explorer_features_cluster_id"), ["cluster_id"], unique=False)


def downgrade():
    with op.batch_alter_table("rock_explorer_features", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_rock_explorer_features_cluster_id"))
    op.drop_table("rock_explorer_features")
    op.drop_table("rock_explorer_clusters")

    ENUM(name="rockexplorerpotentialenum", create_type=False).drop(op.get_bind(), checkfirst=True)
    ENUM(name="rockexplorerrockqualityenum", create_type=False).drop(op.get_bind(), checkfirst=True)
    ENUM(name="rockexplorerrocktypeenum", create_type=False).drop(op.get_bind(), checkfirst=True)
