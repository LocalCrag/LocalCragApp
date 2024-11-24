from flask_jwt_extended import get_jwt_identity

from models.user import User


def current_user_id_factory():
    """
    Return the user id that issued the request for storage in the version table.
    """
    identity = get_jwt_identity()
    if not identity:
        return None
    user = User.find_by_email(identity)
    return user.id
