from flask import current_app

from app import app
from extensions import db
from helpers.user_helpers import create_user
from models.user import User


def add_superadmin():
    """
    Adds the initial superadmin user account.
    """
    with app.app_context():
        if not User.find_by_email(current_app.config["SUPERADMIN_EMAIL"]):
            if (
                not current_app.config["SUPERADMIN_FIRSTNAME"]
                or not current_app.config["SUPERADMIN_LASTNAME"]
                or not current_app.config["SUPERADMIN_EMAIL"]
            ):
                raise ValueError(
                    "SUPERADMIN_FIRSTNAME, SUPERADMIN_LASTNAME, and SUPERADMIN_EMAIL must be set in the environment."
                )
            user_data = {
                "firstname": current_app.config["SUPERADMIN_FIRSTNAME"],
                "lastname": current_app.config["SUPERADMIN_LASTNAME"],
                "email": current_app.config["SUPERADMIN_EMAIL"],
            }
            user = create_user(user_data)
            user.superadmin = True
            user.admin = True
            user.moderator = True
            user.member = True
            db.session.add(user)
            db.session.commit()
            print("Added superadmin user.")


if __name__ == "__main__":
    add_superadmin()
