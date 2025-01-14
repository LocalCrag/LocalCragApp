"""empty message

Revision ID: 5c1050b727b9
Revises: b94293cf34db
Create Date: 2024-01-29 12:23:41.207733

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "5c1050b727b9"
down_revision = "b94293cf34db"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "line_paths",
        sa.Column("line_id", sa.UUID(), nullable=False),
        sa.Column("topo_image_id", sa.UUID(), nullable=False),
        sa.Column("path", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("time_created", sa.DateTime(), nullable=True),
        sa.Column("time_updated", sa.DateTime(), nullable=True),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["line_id"],
            ["lines.id"],
        ),
        sa.ForeignKeyConstraint(
            ["topo_image_id"],
            ["topo_images.id"],
        ),
        sa.PrimaryKeyConstraint("line_id", "topo_image_id", "id"),
        sa.UniqueConstraint("id"),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("line_paths")
    # ### end Alembic commands ###
