"""empty message

Revision ID: 5f70751349da
Revises: f2b00f47697f
Create Date: 2023-07-24 16:25:14.603605

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "5f70751349da"
down_revision = "f2b00f47697f"
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("areas", schema=None) as batch_op:
        batch_op.add_column(sa.Column("portrait_image_id", sa.UUID(), nullable=True))
        batch_op.add_column(sa.Column("sector_id", sa.UUID(), nullable=False))
        batch_op.add_column(sa.Column("slug", sa.String(), nullable=False))
        batch_op.create_unique_constraint(None, ["slug"])
        batch_op.drop_constraint("areas_crag_id_fkey", type_="foreignkey")
        batch_op.create_foreign_key(None, "sectors", ["sector_id"], ["id"])
        batch_op.create_foreign_key(None, "files", ["portrait_image_id"], ["id"])
        batch_op.drop_column("crag_id")

    with op.batch_alter_table("crags", schema=None) as batch_op:
        batch_op.create_unique_constraint(None, ["slug"])

    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.add_column(sa.Column("slug", sa.String(), nullable=False))
        batch_op.create_unique_constraint(None, ["slug"])

    with op.batch_alter_table("regions", schema=None) as batch_op:
        batch_op.add_column(sa.Column("slug", sa.String()))
        batch_op.create_unique_constraint(None, ["slug"])

    with op.batch_alter_table("sectors", schema=None) as batch_op:
        batch_op.create_unique_constraint(None, ["slug"])

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("sectors", schema=None) as batch_op:
        batch_op.drop_constraint(None, type_="unique")

    with op.batch_alter_table("regions", schema=None) as batch_op:
        batch_op.drop_constraint(None, type_="unique")
        batch_op.drop_column("slug")

    with op.batch_alter_table("lines", schema=None) as batch_op:
        batch_op.drop_constraint(None, type_="unique")
        batch_op.drop_column("slug")

    with op.batch_alter_table("crags", schema=None) as batch_op:
        batch_op.drop_constraint(None, type_="unique")

    with op.batch_alter_table("areas", schema=None) as batch_op:
        batch_op.add_column(sa.Column("crag_id", sa.UUID(), autoincrement=False, nullable=False))
        batch_op.drop_constraint(None, type_="foreignkey")
        batch_op.drop_constraint(None, type_="foreignkey")
        batch_op.create_foreign_key("areas_crag_id_fkey", "crags", ["crag_id"], ["id"])
        batch_op.drop_constraint(None, type_="unique")
        batch_op.drop_column("slug")
        batch_op.drop_column("sector_id")
        batch_op.drop_column("portrait_image_id")

    # ### end Alembic commands ###
