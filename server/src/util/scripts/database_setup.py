from util.scripts.add_initial_instance_settings import add_initial_instance_settings
from util.scripts.add_initial_data import add_initial_data
from util.scripts.add_superadmin import add_superadmin


def setup_database(down=False):
    """
    Runs all migration scripts in the correct order.
    """
    scripts = [
        add_superadmin,
        add_initial_data,
        add_initial_instance_settings,
    ]
    if down:
        scripts = reversed(scripts)
    for script in scripts:
        script()


if __name__ == "__main__":
    setup_database()
