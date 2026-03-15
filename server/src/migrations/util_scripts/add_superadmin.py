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
        # Prevent creating multiple superadmins.
        if User.query.filter_by(superadmin=True).first():
            print("Superadmin already exists. Skipping.")
            return

        superadmin_email = (current_app.config.get("SUPERADMIN_EMAIL") or "").strip().lower()

        # If the configured email already exists, do not create a new superadmin.
        # (This avoids creating a second account and avoids implicitly elevating an existing one.)
        if superadmin_email and User.find_by_email(superadmin_email):
            print("Configured SUPERADMIN_EMAIL already exists. Skipping.")
            return

        if (
            not current_app.config.get("SUPERADMIN_FIRSTNAME")
            or not current_app.config.get("SUPERADMIN_LASTNAME")
            or not superadmin_email
        ):
            raise ValueError(
                "SUPERADMIN_FIRSTNAME, SUPERADMIN_LASTNAME, and SUPERADMIN_EMAIL must be set in the environment."
            )

        user_data = {
            "firstname": current_app.config["SUPERADMIN_FIRSTNAME"],
            "lastname": current_app.config["SUPERADMIN_LASTNAME"],
            "email": superadmin_email,
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
