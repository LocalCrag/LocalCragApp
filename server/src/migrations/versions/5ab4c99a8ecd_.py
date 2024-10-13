"""empty message

Revision ID: 5ab4c99a8ecd
Revises: 538e17ab1cad
Create Date: 2024-04-10 08:38:45.505915

"""

# revision identifiers, used by Alembic.
revision = "5ab4c99a8ecd"
down_revision = "538e17ab1cad"
branch_labels = None
depends_on = None


def upgrade():
    # The old migration used the user model directly from the models which wasn't compatible with new changes.
    # As we can be sure, that no users that are existing on any instance have no slug, we can just skip the
    # create-initial-slug part and just pass here now.
    pass


def downgrade():
    pass
