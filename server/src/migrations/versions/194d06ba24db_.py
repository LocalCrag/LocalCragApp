"""empty message

Revision ID: 194d06ba24db
Revises: 388dbc0da585
Create Date: 2024-02-25 17:37:26.304056

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "194d06ba24db"
down_revision = "388dbc0da585"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("lowball", sa.Boolean(), nullable=False, server_default="0"))
        batch_op.add_column(sa.Column("bad_dropzone", sa.Boolean(), nullable=False, server_default="0"))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.drop_column("bad_dropzone")
        batch_op.drop_column("lowball")

    # ### end Alembic commands ###
