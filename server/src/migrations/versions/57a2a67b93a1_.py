"""empty message

Revision ID: 57a2a67b93a1
Revises: 58e8d64cccf2
Create Date: 2024-01-24 12:36:58.039442

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "57a2a67b93a1"
down_revision = "58e8d64cccf2"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("grade_name", sa.String(length=120), nullable=False))
        batch_op.add_column(sa.Column("grade_scale", sa.String(length=120), nullable=False))
        batch_op.drop_column("gradeName")
        batch_op.drop_column("gradeScale")

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("gradeScale", sa.VARCHAR(length=120), autoincrement=False, nullable=False))
        batch_op.add_column(sa.Column("gradeName", sa.VARCHAR(length=120), autoincrement=False, nullable=False))
        batch_op.drop_column("grade_scale")
        batch_op.drop_column("grade_name")

    # ### end Alembic commands ###
