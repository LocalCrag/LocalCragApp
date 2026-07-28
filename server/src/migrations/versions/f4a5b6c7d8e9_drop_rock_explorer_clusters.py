"""Drop rock explorer clusters

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-07-27 20:55:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM, JSON, UUID

# revision identifiers, used by Alembic.
revision = "f4a5b6c7d8e9"
down_revision = "e3f4a5b6c7d8"
branch_labels = None
depends_on = None


def upgrade():
    # Cluster-owned topo links become invalid once cluster_id is removed.
    op.execute(sa.text("DELETE FROM rock_explorer_topo_links WHERE cluster_id IS NOT NULL"))

    with op.batch_alter_table("rock_explorer_topo_links", schema=None) as batch_op:
        batch_op.drop_constraint("ck_rock_explorer_topo_links_owner", type_="check")
        batch_op.drop_constraint("rock_explorer_topo_links_cluster_id_fkey", type_="foreignkey")
        batch_op.drop_index(batch_op.f("ix_rock_explorer_topo_links_cluster_id"))
        batch_op.drop_column("cluster_id")
        batch_op.create_check_constraint(
            "ck_rock_explorer_topo_links_owner",
            "feature_id IS NOT NULL",
        )

    with op.batch_alter_table("rock_explorer_features", schema=None) as batch_op:
        batch_op.drop_constraint("rock_explorer_features_cluster_id_fkey", type_="foreignkey")
        batch_op.drop_index(batch_op.f("ix_rock_explorer_features_cluster_id"))
        batch_op.drop_column("cluster_id")

    op.drop_table("rock_explorer_clusters")


def downgrade():
    potential_enum = ENUM(
        "HIGH",
        "MEDIUM",
        "LOW",
        "NONE",
        "UNEXPLORED",
        name="rockexplorerpotentialenum",
        create_type=False,
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
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rock_explorer_clusters")),
        sa.UniqueConstraint("id"),
    )

    with op.batch_alter_table("rock_explorer_features", schema=None) as batch_op:
        batch_op.add_column(sa.Column("cluster_id", UUID(), nullable=True))
        batch_op.create_foreign_key(
            "rock_explorer_features_cluster_id_fkey",
            "rock_explorer_clusters",
            ["cluster_id"],
            ["id"],
            ondelete="SET NULL",
        )
        batch_op.create_index(batch_op.f("ix_rock_explorer_features_cluster_id"), ["cluster_id"], unique=False)

    with op.batch_alter_table("rock_explorer_topo_links", schema=None) as batch_op:
        batch_op.drop_constraint("ck_rock_explorer_topo_links_owner", type_="check")
        batch_op.add_column(sa.Column("cluster_id", UUID(), nullable=True))
        batch_op.create_foreign_key(
            "rock_explorer_topo_links_cluster_id_fkey",
            "rock_explorer_clusters",
            ["cluster_id"],
            ["id"],
            ondelete="CASCADE",
        )
        batch_op.create_index(batch_op.f("ix_rock_explorer_topo_links_cluster_id"), ["cluster_id"], unique=False)
        batch_op.create_check_constraint(
            "ck_rock_explorer_topo_links_owner",
            "(feature_id IS NOT NULL AND cluster_id IS NULL) OR " "(feature_id IS NULL AND cluster_id IS NOT NULL)",
        )
