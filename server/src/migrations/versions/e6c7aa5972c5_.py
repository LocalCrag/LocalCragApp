"""empty message

Revision ID: e6c7aa5972c5
Revises: 2fb74e915d95
Create Date: 2024-04-18 15:08:25.690302

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e6c7aa5972c5"
down_revision = "2fb74e915d95"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("ascents", schema=None) as batch_op:
        batch_op.alter_column("created_by_id", existing_type=sa.UUID(), nullable=False)
        batch_op.drop_constraint("ascents_created_by_id_fkey", type_="foreignkey")
        batch_op.create_foreign_key(None, "users", ["created_by_id"], ["id"])

    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("morpho", sa.Boolean(), server_default="0", nullable=False))
        batch_op.drop_column("user_rating")

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("user_rating", sa.INTEGER(), autoincrement=False, nullable=True))
        batch_op.drop_column("morpho")

    with op.batch_alter_table("ascents", schema=None) as batch_op:
        batch_op.drop_constraint(None, type_="foreignkey")
        batch_op.create_foreign_key(
            "ascents_created_by_id_fkey", "users", ["created_by_id"], ["id"], ondelete="SET NULL"
        )
        batch_op.alter_column("created_by_id", existing_type=sa.UUID(), nullable=True)

    # ### end Alembic commands ###
