"""empty message

Revision ID: 2747132e7558
Revises: a326d5fb1d1d
Create Date: 2024-04-10 10:24:57.495247

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "2747132e7558"
down_revision = "a326d5fb1d1d"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("ascents", schema=None) as batch_op:
        batch_op.add_column(sa.Column("crag_id", sa.UUID(), nullable=False))
        batch_op.add_column(sa.Column("sector_id", sa.UUID(), nullable=False))
        batch_op.add_column(sa.Column("area_id", sa.UUID(), nullable=False))
        batch_op.create_foreign_key(None, "areas", ["area_id"], ["id"])
        batch_op.create_foreign_key(None, "crags", ["crag_id"], ["id"])
        batch_op.create_foreign_key(None, "sectors", ["sector_id"], ["id"])

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("ascents", schema=None) as batch_op:
        batch_op.drop_constraint(None, type_="foreignkey")
        batch_op.drop_constraint(None, type_="foreignkey")
        batch_op.drop_constraint(None, type_="foreignkey")
        batch_op.drop_column("area_id")
        batch_op.drop_column("sector_id")
        batch_op.drop_column("crag_id")

    # ### end Alembic commands ###
