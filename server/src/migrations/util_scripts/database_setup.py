from migrations.util_scripts.add_backup_user import add_backup_user
from migrations.util_scripts.add_initial_data import add_initial_data
from migrations.util_scripts.add_initial_instance_settings import (
    add_initial_instance_settings,
)
from migrations.util_scripts.add_scales import add_scales
from migrations.util_scripts.add_superadmin import add_superadmin


def database_setup():
    """
    Add initial data to the database.
    """
    add_initial_instance_settings()
    add_superadmin()
    add_initial_data()
    add_scales()
    add_backup_user()
