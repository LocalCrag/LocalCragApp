from flask import current_app

from app import app
from helpers.user_helpers import create_user
from models.user import User


def add_superadmin():
    """
    Adds the initial superadmin user account.
    """
    with app.app_context():
        if not User.find_by_email(current_app.config['SUPERADMIN_EMAIL']):
            user_data = {
                "firstname": current_app.config['SUPERADMIN_FIRSTNAME'],
                "lastname": current_app.config['SUPERADMIN_LASTNAME'],
                "email": current_app.config['SUPERADMIN_EMAIL'],
                "language": 'de'
            }
            create_user(user_data)
            print('Added superadmin user.')


if __name__ == "__main__":
    add_superadmin()
