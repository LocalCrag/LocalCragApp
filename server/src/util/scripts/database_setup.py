from util.scripts.add_root_user import add_root_user


def setup_database(down=False):
    """
    Runs all migration scripts in the correct order.
    """
    scripts = [
        add_root_user
    ]
    if down:
        scripts = reversed(scripts)
    for script in scripts:
        script()


if __name__ == "__main__":
    setup_database()
