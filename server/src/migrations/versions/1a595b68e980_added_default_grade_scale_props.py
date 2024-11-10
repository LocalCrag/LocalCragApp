"""Added default grade scale props

Revision ID: 1a595b68e980
Revises: 1f3d6152b471
Create Date: 2024-11-10 19:51:39.162666

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "1a595b68e980"
down_revision = "1f3d6152b471"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("areas", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("default_boulder_scale", sa.String(length=32), server_default="NULL", nullable=True)
        )
        batch_op.add_column(
            sa.Column("default_sport_scale", sa.String(length=32), server_default="NULL", nullable=True)
        )
        batch_op.add_column(sa.Column("default_trad_scale", sa.String(length=32), server_default="NULL", nullable=True))

    with op.batch_alter_table("crags", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("default_boulder_scale", sa.String(length=32), server_default="NULL", nullable=True)
        )
        batch_op.add_column(
            sa.Column("default_sport_scale", sa.String(length=32), server_default="NULL", nullable=True)
        )
        batch_op.add_column(sa.Column("default_trad_scale", sa.String(length=32), server_default="NULL", nullable=True))

    with op.batch_alter_table("sectors", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("default_boulder_scale", sa.String(length=32), server_default="NULL", nullable=True)
        )
        batch_op.add_column(
            sa.Column("default_sport_scale", sa.String(length=32), server_default="NULL", nullable=True)
        )
        batch_op.add_column(sa.Column("default_trad_scale", sa.String(length=32), server_default="NULL", nullable=True))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("sectors", schema=None) as batch_op:
        batch_op.drop_column("default_trad_scale")
        batch_op.drop_column("default_sport_scale")
        batch_op.drop_column("default_boulder_scale")

    with op.batch_alter_table("crags", schema=None) as batch_op:
        batch_op.drop_column("default_trad_scale")
        batch_op.drop_column("default_sport_scale")
        batch_op.drop_column("default_boulder_scale")

    with op.batch_alter_table("areas", schema=None) as batch_op:
        batch_op.drop_column("default_trad_scale")
        batch_op.drop_column("default_sport_scale")
        batch_op.drop_column("default_boulder_scale")

    # ### end Alembic commands ###
