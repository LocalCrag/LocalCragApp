"""Added 'archive' property to lines and topo_images

Revision ID: fc965fe6216c
Revises: 544c5d2ae547
Create Date: 2024-09-29 13:36:26.679164

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "fc965fe6216c"
down_revision = "544c5d2ae547"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("archived", sa.Boolean(), server_default="false", nullable=False))
        batch_op.drop_column("old")

    with op.batch_alter_table("topo_images", schema=None) as batch_op:
        batch_op.add_column(sa.Column("archived", sa.Boolean(), server_default="false", nullable=False))
        batch_op.drop_column("old")

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("topo_images", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("old", sa.BOOLEAN(), server_default=sa.text("false"), autoincrement=False, nullable=False)
        )
        batch_op.drop_column("archived")

    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("old", sa.BOOLEAN(), server_default=sa.text("false"), autoincrement=False, nullable=False)
        )
        batch_op.drop_column("archived")

    # ### end Alembic commands ###
