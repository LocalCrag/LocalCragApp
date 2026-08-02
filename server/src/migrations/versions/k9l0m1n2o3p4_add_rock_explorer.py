"""Add rock explorer features, topo-link tags, gallery GPS, and file EXIF coords

Revision ID: k9l0m1n2o3p4
Revises: b3c5d7e9f1a2
Create Date: 2026-07-30 22:45:00.000000

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM, JSON, UUID

# revision identifiers, used by Alembic.
revision = "k9l0m1n2o3p4"
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
    empty_json = sa.text("'[]'::json")

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
        sa.Column("access_issues", JSON(), nullable=False, server_default=empty_json),
        sa.Column("geometry", JSON(), nullable=False),
        sa.Column("parking_sites", JSON(), nullable=False, server_default=empty_json),
        sa.Column("paths", JSON(), nullable=False, server_default=empty_json),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rock_explorer_features")),
        sa.UniqueConstraint("id"),
    )

    op.create_table(
        "rock_explorer_feature_tags",
        sa.Column("tag_id", UUID(), nullable=True),
        sa.Column("rock_explorer_feature_id", UUID(), nullable=True),
        sa.ForeignKeyConstraint(["rock_explorer_feature_id"], ["rock_explorer_features.id"]),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"]),
    )

    with op.batch_alter_table("gallery_images", schema=None) as batch_op:
        batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("lat", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("lng", sa.Float(), nullable=True))

    with op.batch_alter_table("files", schema=None) as batch_op:
        batch_op.add_column(sa.Column("exif_lat", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("exif_lng", sa.Float(), nullable=True))


def downgrade():
    with op.batch_alter_table("files", schema=None) as batch_op:
        batch_op.drop_column("exif_lng")
        batch_op.drop_column("exif_lat")

    with op.batch_alter_table("gallery_images", schema=None) as batch_op:
        batch_op.drop_column("lng")
        batch_op.drop_column("lat")
        batch_op.drop_column("description")

    op.drop_table("rock_explorer_feature_tags")
    op.drop_table("rock_explorer_features")

    ENUM(name="rockexplorerpotentialenum", create_type=False).drop(op.get_bind(), checkfirst=True)
    ENUM(name="rockexplorerrockqualityenum", create_type=False).drop(op.get_bind(), checkfirst=True)
    ENUM(name="rockexplorerrocktypeenum", create_type=False).drop(op.get_bind(), checkfirst=True)
