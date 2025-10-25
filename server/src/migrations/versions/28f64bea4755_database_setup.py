"""empty message

Revision ID: 28f64bea4755
Revises: 43fac44d1505
Create Date: 2025-10-25 09:48:49.519134

"""

from migrations.util_scripts.add_backup_user import add_backup_user
from migrations.util_scripts.add_initial_data import add_initial_data
from migrations.util_scripts.add_initial_instance_settings import (
    add_initial_instance_settings,
)
from migrations.util_scripts.add_scales import add_scales
from migrations.util_scripts.add_superadmin import add_superadmin

# revision identifiers, used by Alembic.
revision = "28f64bea4755"
down_revision = "43fac44d1505"
branch_labels = None
depends_on = None


def upgrade():
    add_superadmin()
    add_initial_data()
    add_scales()
    add_initial_instance_settings()
    add_backup_user()


def downgrade():
    pass
