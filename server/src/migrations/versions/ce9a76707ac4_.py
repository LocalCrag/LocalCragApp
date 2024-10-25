"""empty message

Revision ID: ce9a76707ac4
Revises: ab57a16e66a9
Create Date: 2024-02-06 08:42:55.818225

"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = "ce9a76707ac4"
down_revision = "ab57a16e66a9"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.execute("create type startingpositionenum as enum ('SIT', 'STAND', 'CROUCH', 'FRENCH', 'CANDLE');")

    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "starting_position", sa.Enum("SIT", "STAND", "CROUCH", "FRENCH", "CANDLE", name="startingpositionenum")
            )
        )

    conn = op.get_bind()
    conn.execute(text("UPDATE lines SET starting_position = 'SIT' WHERE sitstart = true"))
    conn.execute(text("UPDATE lines SET starting_position = 'STAND' WHERE sitstart = false"))

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.drop_column("starting_position")

    # ### end Alembic commands ###
