"""user and author grade values and ratings

Revision ID: 4306dc5f0c18
Revises: 53f25a93f9c8
Create Date: 2025-04-27 05:38:22.632602

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "4306dc5f0c18"
down_revision = "53f25a93f9c8"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.alter_column("grade_value", new_column_name="author_grade_value")
        batch_op.add_column(sa.Column("user_grade_value", sa.Integer(), nullable=True))
        batch_op.alter_column("rating", new_column_name="author_rating")
        batch_op.add_column(sa.Column("user_rating", sa.Integer(), nullable=True))

    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.alter_column("user_grade_value", nullable=False)
        batch_op.execute(sa.text("UPDATE lines SET user_grade_value = author_grade_value"))
        batch_op.execute(sa.text("UPDATE lines SET user_rating = author_rating"))

    print(
        "WARNING: You need to manually run util/scripts/calculate_user_grades.py "
        "to calculate user grades and ratings for existing lines"
    )


def downgrade():
    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.alter_column("author_grade_value", new_column_name="grade_value")
        batch_op.drop_column("user_grade_value")
        batch_op.alter_column("author_rating", new_column_name="rating")
        batch_op.drop_column("user_rating")
