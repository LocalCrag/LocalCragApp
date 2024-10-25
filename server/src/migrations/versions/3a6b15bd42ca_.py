"""empty message

Revision ID: 3a6b15bd42ca
Revises: 1301e651ea69
Create Date: 2024-06-26 22:39:23.621428

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "3a6b15bd42ca"
down_revision = "1301e651ea69"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
    UPDATE areas
    SET name = TRIM(name)
    """
    )
    op.execute(
        """
    UPDATE crags
    SET name = TRIM(name)
    """
    )
    op.execute(
        """
    UPDATE sectors
    SET name = TRIM(name)
    """
    )
    op.execute(
        """
    UPDATE lines
    SET name = TRIM(name)
    """
    )
    op.execute(
        """
    UPDATE regions
    SET name = TRIM(name)
    """
    )
    op.execute(
        """
    UPDATE menu_pages
    SET title = TRIM(title)
    """
    )
    op.execute(
        """
    UPDATE posts
    SET title = TRIM(title)
    """
    )


def downgrade():
    pass
