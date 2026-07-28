"""Migrate rock explorer topo links to a multi-link association table

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-07-27 19:30:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = "e3f4a5b6c7d8"
down_revision = "d2e3f4a5b6c7"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "rock_explorer_topo_links",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("feature_id", UUID(), nullable=True),
        sa.Column("cluster_id", UUID(), nullable=True),
        sa.Column("crag_id", UUID(), nullable=True),
        sa.Column("sector_id", UUID(), nullable=True),
        sa.Column("area_id", UUID(), nullable=True),
        sa.Column("line_id", UUID(), nullable=True),
        sa.CheckConstraint(
            "(feature_id IS NOT NULL AND cluster_id IS NULL) OR " "(feature_id IS NULL AND cluster_id IS NOT NULL)",
            name="ck_rock_explorer_topo_links_owner",
        ),
        sa.CheckConstraint(
            "("
            "(crag_id IS NOT NULL)::int + (sector_id IS NOT NULL)::int + "
            "(area_id IS NOT NULL)::int + (line_id IS NOT NULL)::int"
            ") = 1",
            name="ck_rock_explorer_topo_links_single_target",
        ),
        sa.ForeignKeyConstraint(["area_id"], ["areas.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cluster_id"], ["rock_explorer_clusters.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["crag_id"], ["crags.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["feature_id"], ["rock_explorer_features.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["line_id"], ["lines.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["sector_id"], ["sectors.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rock_explorer_topo_links")),
    )
    op.create_index(
        op.f("ix_rock_explorer_topo_links_feature_id"),
        "rock_explorer_topo_links",
        ["feature_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_rock_explorer_topo_links_cluster_id"),
        "rock_explorer_topo_links",
        ["cluster_id"],
        unique=False,
    )

    # Copy existing single-leaf FKs into link rows.
    op.execute(
        sa.text(
            """
            INSERT INTO rock_explorer_topo_links (id, feature_id, line_id)
            SELECT gen_random_uuid(), id, line_id
            FROM rock_explorer_features WHERE line_id IS NOT NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            INSERT INTO rock_explorer_topo_links (id, feature_id, area_id)
            SELECT gen_random_uuid(), id, area_id
            FROM rock_explorer_features WHERE area_id IS NOT NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            INSERT INTO rock_explorer_topo_links (id, feature_id, sector_id)
            SELECT gen_random_uuid(), id, sector_id
            FROM rock_explorer_features WHERE sector_id IS NOT NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            INSERT INTO rock_explorer_topo_links (id, feature_id, crag_id)
            SELECT gen_random_uuid(), id, crag_id
            FROM rock_explorer_features WHERE crag_id IS NOT NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            INSERT INTO rock_explorer_topo_links (id, cluster_id, line_id)
            SELECT gen_random_uuid(), id, line_id
            FROM rock_explorer_clusters WHERE line_id IS NOT NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            INSERT INTO rock_explorer_topo_links (id, cluster_id, area_id)
            SELECT gen_random_uuid(), id, area_id
            FROM rock_explorer_clusters WHERE area_id IS NOT NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            INSERT INTO rock_explorer_topo_links (id, cluster_id, sector_id)
            SELECT gen_random_uuid(), id, sector_id
            FROM rock_explorer_clusters WHERE sector_id IS NOT NULL
            """
        )
    )
    op.execute(
        sa.text(
            """
            INSERT INTO rock_explorer_topo_links (id, cluster_id, crag_id)
            SELECT gen_random_uuid(), id, crag_id
            FROM rock_explorer_clusters WHERE crag_id IS NOT NULL
            """
        )
    )

    for table_name in ("rock_explorer_features", "rock_explorer_clusters"):
        with op.batch_alter_table(table_name, schema=None) as batch_op:
            batch_op.drop_column("crag_id")
            batch_op.drop_column("sector_id")
            batch_op.drop_column("area_id")
            batch_op.drop_column("line_id")


def downgrade():
    for table_name in ("rock_explorer_features", "rock_explorer_clusters"):
        with op.batch_alter_table(table_name, schema=None) as batch_op:
            batch_op.add_column(sa.Column("crag_id", UUID(), nullable=True))
            batch_op.add_column(sa.Column("sector_id", UUID(), nullable=True))
            batch_op.add_column(sa.Column("area_id", UUID(), nullable=True))
            batch_op.add_column(sa.Column("line_id", UUID(), nullable=True))
            batch_op.create_foreign_key(
                None,
                "crags",
                ["crag_id"],
                ["id"],
                ondelete="SET NULL",
            )
            batch_op.create_foreign_key(
                None,
                "sectors",
                ["sector_id"],
                ["id"],
                ondelete="SET NULL",
            )
            batch_op.create_foreign_key(
                None,
                "areas",
                ["area_id"],
                ["id"],
                ondelete="SET NULL",
            )
            batch_op.create_foreign_key(
                None,
                "lines",
                ["line_id"],
                ["id"],
                ondelete="SET NULL",
            )

    # Restore at most one link per owner (priority: line > area > sector > crag).
    for owner_table, owner_col in (
        ("rock_explorer_features", "feature_id"),
        ("rock_explorer_clusters", "cluster_id"),
    ):
        op.execute(
            sa.text(
                f"""
                UPDATE {owner_table} AS t
                SET
                    line_id = l.line_id,
                    area_id = CASE WHEN l.line_id IS NULL THEN l.area_id ELSE NULL END,
                    sector_id = CASE
                        WHEN l.line_id IS NULL AND l.area_id IS NULL THEN l.sector_id
                        ELSE NULL
                    END,
                    crag_id = CASE
                        WHEN l.line_id IS NULL AND l.area_id IS NULL AND l.sector_id IS NULL
                        THEN l.crag_id
                        ELSE NULL
                    END
                FROM (
                    SELECT DISTINCT ON ({owner_col})
                        {owner_col},
                        line_id,
                        area_id,
                        sector_id,
                        crag_id
                    FROM rock_explorer_topo_links
                    WHERE {owner_col} IS NOT NULL
                    ORDER BY
                        {owner_col},
                        (line_id IS NOT NULL) DESC,
                        (area_id IS NOT NULL) DESC,
                        (sector_id IS NOT NULL) DESC,
                        (crag_id IS NOT NULL) DESC
                ) AS l
                WHERE t.id = l.{owner_col}
                """
            )
        )

    op.drop_index(op.f("ix_rock_explorer_topo_links_cluster_id"), table_name="rock_explorer_topo_links")
    op.drop_index(op.f("ix_rock_explorer_topo_links_feature_id"), table_name="rock_explorer_topo_links")
    op.drop_table("rock_explorer_topo_links")
