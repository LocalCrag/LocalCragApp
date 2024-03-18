from flask import current_app

from app import app
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from helpers.user_helpers import create_user
from models.mixins.has_slug import str_to_slug
from models.region import Region
from models.user import User


def add_region():
    """
    Adds the initial region.
    """
    with app.app_context():
        try:
            Region.find_by_slug(str_to_slug(current_app.config['REGION']))
        except NotFound:
            new_region = Region()
            new_region.name = current_app.config['REGION']
            db.session.add(new_region)
            db.session.commit()
            print('Added region {}.'.format(current_app.config['REGION']))


if __name__ == "__main__":
    add_region()
