"""empty message

Revision ID: 28f64bea4755
Revises: 43fac44d1505
Create Date: 2025-10-25 09:48:49.519134

"""

# revision identifiers, used by Alembic.
revision = "28f64bea4755"
down_revision = "43fac44d1505"
branch_labels = None
depends_on = None


def upgrade():
    pass
    # Setup scripts have been moved to env.py to ensure they run only after all migrations
    # add_superadmin()
    # add_initial_data()
    # add_scales()
    # add_initial_instance_settings()
    # add_backup_user()


def downgrade():
    pass
