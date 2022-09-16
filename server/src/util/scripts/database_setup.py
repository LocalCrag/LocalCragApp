from util.scripts.add_superadmin import add_superadmin


def setup_database(down=False):
    """
    Runs all migration scripts in the correct order.
    """
    scripts = [
        add_superadmin
    ]
    if down:
        scripts = reversed(scripts)
    for script in scripts:
        script()


if __name__ == "__main__":
    setup_database()
