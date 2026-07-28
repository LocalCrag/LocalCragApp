"""Migrate rock explorer topo links onto shared Tag associations

Revision ID: g5h6i7j8k9l0
Revises: f4a5b6c7d8e9
Create Date: 2026-07-27 21:15:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = "g5h6i7j8k9l0"
down_revision = "f4a5b6c7d8e9"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "rock_explorer_feature_tags",
        sa.Column("tag_id", UUID(), nullable=True),
        sa.Column("rock_explorer_feature_id", UUID(), nullable=True),
        sa.ForeignKeyConstraint(["rock_explorer_feature_id"], ["rock_explorer_features.id"]),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"]),
    )

    for object_type, column in (
        ("Line", "line_id"),
        ("Area", "area_id"),
        ("Sector", "sector_id"),
        ("Crag", "crag_id"),
    ):
        op.execute(
            sa.text(
                f"""
                INSERT INTO tags (id, object_type, object_id)
                SELECT gen_random_uuid(), :object_type, t.{column}
                FROM rock_explorer_topo_links t
                WHERE t.{column} IS NOT NULL
                  AND NOT EXISTS (
                    SELECT 1 FROM tags existing
                    WHERE existing.object_type = :object_type
                      AND existing.object_id = t.{column}
                  )
                """
            ).bindparams(object_type=object_type)
        )
        op.execute(
            sa.text(
                f"""
                INSERT INTO rock_explorer_feature_tags (tag_id, rock_explorer_feature_id)
                SELECT tags.id, t.feature_id
                FROM rock_explorer_topo_links t
                JOIN tags ON tags.object_type = :object_type AND tags.object_id = t.{column}
                WHERE t.{column} IS NOT NULL
                  AND t.feature_id IS NOT NULL
                """
            ).bindparams(object_type=object_type)
        )

    op.drop_table("rock_explorer_topo_links")


def downgrade():
    op.create_table(
        "rock_explorer_topo_links",
        sa.Column("id", UUID(), nullable=False),
        sa.Column("feature_id", UUID(), nullable=True),
        sa.Column("crag_id", UUID(), nullable=True),
        sa.Column("sector_id", UUID(), nullable=True),
        sa.Column("area_id", UUID(), nullable=True),
        sa.Column("line_id", UUID(), nullable=True),
        sa.CheckConstraint(
            "feature_id IS NOT NULL",
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

    for object_type, column in (
        ("Line", "line_id"),
        ("Area", "area_id"),
        ("Sector", "sector_id"),
        ("Crag", "crag_id"),
    ):
        op.execute(
            sa.text(
                f"""
                INSERT INTO rock_explorer_topo_links (id, feature_id, {column})
                SELECT gen_random_uuid(), ft.rock_explorer_feature_id, tags.object_id
                FROM rock_explorer_feature_tags ft
                JOIN tags ON tags.id = ft.tag_id
                WHERE tags.object_type = :object_type
                """
            ).bindparams(object_type=object_type)
        )

    op.drop_table("rock_explorer_feature_tags")
