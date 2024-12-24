"""Moved scales into db

Revision ID: 1f3d6152b471
Revises: ef078cb3139d
Create Date: 2024-11-10 16:40:27.782016

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "1f3d6152b471"
down_revision = "ef078cb3139d"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "scales",
        sa.Column("name", sa.String(length=32), nullable=False),
        sa.Column("type", postgresql.ENUM(name="linetypeenum", create_type=False), nullable=False),
        sa.Column("grades", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column("grade_brackets", postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.PrimaryKeyConstraint("name", "type"),
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table("scales")
    # ### end Alembic commands ###
