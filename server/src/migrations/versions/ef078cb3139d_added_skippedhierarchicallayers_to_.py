"""Added skippedHierarchicalLayers to instance_settings

Revision ID: ef078cb3139d
Revises: 6fe7f8cbfc44
Create Date: 2024-10-30 18:10:33.992135

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "ef078cb3139d"
down_revision = "6fe7f8cbfc44"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.add_column(sa.Column("skipped_hierarchical_layers", sa.Integer(), server_default="0", nullable=False))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("instance_settings", schema=None) as batch_op:
        batch_op.drop_column("skipped_hierarchical_layers")

    # ### end Alembic commands ###