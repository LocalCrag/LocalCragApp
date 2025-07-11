from util.scripts.add_backup_user import add_backup_user
from util.scripts.add_initial_data import add_initial_data
from util.scripts.add_initial_instance_settings import add_initial_instance_settings
from util.scripts.add_scales import add_scales
from util.scripts.add_superadmin import add_superadmin


def setup_database(down=False):
    """
    Runs all migration scripts in the correct order.
    """
    scripts = [
        add_superadmin,
        add_initial_data,
        add_scales,
        add_initial_instance_settings,
        add_backup_user,
    ]
    if down:
        scripts = reversed(scripts)
    for script in scripts:
        script()


if __name__ == "__main__":
    setup_database()
