from flask_jwt_extended import verify_jwt_in_request, get_jwt

from models.user import User


def get_access_token_claims(user: User):
    return {
        "admin": user.admin,
        "moderator": user.moderator,
        "member": user.member,
    }


def get_show_secret():
    """
    Returns whether a user has access to secret spots.
    """
    has_jwt = bool(verify_jwt_in_request(optional=True))
    claims = get_jwt()
    return has_jwt and (claims['admin'] or claims['moderator'] or claims['member'])
