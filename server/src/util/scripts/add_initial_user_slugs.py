from sqlalchemy.orm.attributes import flag_modified

from app import app
from extensions import db
from models.user import User


def add_initial_user_slugs():
    with app.app_context():
        users = User.return_all()
        for user in users:
            flag_modified(user, 'slug')
            db.session.add(user)
        db.session.commit()


if __name__ == "__main__":
    add_initial_user_slugs()
