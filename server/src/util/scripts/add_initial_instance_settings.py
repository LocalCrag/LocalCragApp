from flask import current_app

from app import app
from extensions import db
from helpers.user_helpers import create_user
from models.instance_settings import InstanceSettings
from models.user import User


def add_initial_instance_settings():
    with app.app_context():
        if not InstanceSettings.return_it():
            instance_settings = InstanceSettings()
            instance_settings.instance_name = 'My LocalCrag'
            instance_settings.copyright_owner = 'Your name goes here'
            db.session.add(instance_settings)
            db.session.commit()
            print('Created initial instance settings.')


if __name__ == "__main__":
    add_initial_instance_settings()
