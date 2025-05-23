"""empty message

Revision ID: 82ab4143b435
Revises: 93468e6cf962
Create Date: 2023-09-10 19:06:18.079881

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "82ab4143b435"
down_revision = "93468e6cf962"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("rating", sa.Integer(), nullable=False))
        batch_op.add_column(sa.Column("fa_year", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("fa_name", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("highball", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("no_topout", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("roof", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("slab", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("vertical", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("overhang", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("athletic", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("technical", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("endurance", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("cruxy", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("dyno", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("jugs", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("sloper", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("crimpy", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("pockets", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("crack", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("dihedral", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("compression", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("arete", sa.Boolean(), nullable=False))
        batch_op.add_column(sa.Column("wall", sa.Boolean(), nullable=False))
        batch_op.drop_column("classic")

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("classic", sa.BOOLEAN(), autoincrement=False, nullable=False))
        batch_op.drop_column("wall")
        batch_op.drop_column("arete")
        batch_op.drop_column("compression")
        batch_op.drop_column("dihedral")
        batch_op.drop_column("crack")
        batch_op.drop_column("pockets")
        batch_op.drop_column("crimpy")
        batch_op.drop_column("sloper")
        batch_op.drop_column("jugs")
        batch_op.drop_column("dyno")
        batch_op.drop_column("cruxy")
        batch_op.drop_column("endurance")
        batch_op.drop_column("technical")
        batch_op.drop_column("athletic")
        batch_op.drop_column("overhang")
        batch_op.drop_column("vertical")
        batch_op.drop_column("slab")
        batch_op.drop_column("roof")
        batch_op.drop_column("no_topout")
        batch_op.drop_column("highball")
        batch_op.drop_column("fa_name")
        batch_op.drop_column("fa_year")
        batch_op.drop_column("rating")

    # ### end Alembic commands ###
