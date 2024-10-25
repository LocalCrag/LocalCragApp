from flask import current_app

from app import app
from extensions import db
from models.region import Region


def add_region():
    """
    Adds the initial region.
    """
    with app.app_context():
        if not Region.return_it():
            new_region = Region()
            new_region.name = current_app.config["REGION"]
            db.session.add(new_region)
            db.session.commit()
            print("Added region {}.".format(current_app.config["REGION"]))


if __name__ == "__main__":
    add_region()
