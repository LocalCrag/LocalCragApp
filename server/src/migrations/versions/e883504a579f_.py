"""empty message

Revision ID: e883504a579f
Revises: 84cb554d4c2b
Create Date: 2024-03-26 16:26:03.419117

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "e883504a579f"
down_revision = "84cb554d4c2b"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("crags", schema=None) as batch_op:
        batch_op.drop_constraint("crags_region_id_fkey", type_="foreignkey")
        batch_op.drop_column("region_id")

    with op.batch_alter_table("regions", schema=None) as batch_op:
        batch_op.drop_constraint("regions_slug_key", type_="unique")
        batch_op.drop_column("slug")

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("regions", schema=None) as batch_op:
        batch_op.add_column(sa.Column("slug", sa.VARCHAR(), autoincrement=False, nullable=False))
        batch_op.create_unique_constraint("regions_slug_key", ["slug"])

    with op.batch_alter_table("crags", schema=None) as batch_op:
        batch_op.add_column(sa.Column("region_id", sa.UUID(), autoincrement=False, nullable=False))
        batch_op.create_foreign_key("crags_region_id_fkey", "regions", ["region_id"], ["id"])

    # ### end Alembic commands ###
