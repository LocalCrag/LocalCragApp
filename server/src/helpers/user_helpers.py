from extensions import db
from models.user import User
from util.email import send_create_user_email
from util.password_util import generate_password


def create_user(user_data, created_by=None) -> User:
    """
    Creates a new user.
    @param user_data: User data as parsed from request.
    @param created_by: User that created the user.
    @return: Created user instance.
    """
    password = generate_password()

    new_user = User()
    new_user.firstname = user_data['firstname']
    new_user.lastname = user_data['lastname']
    new_user.email = user_data['email']
    new_user.language = 'de'
    new_user.password = User.generate_hash(password)
    if created_by:
        new_user.created_by_id = created_by.id

    db.session.add(new_user)
    db.session.commit()

    send_create_user_email(password, new_user)

    return new_user
