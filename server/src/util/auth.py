from flask_jwt_extended import verify_jwt_in_request, get_jwt

from models.user import User


def get_access_token_claims(user: User):
    return {
        "admin": user.admin,
        "moderator": user.moderator,
        "member": user.member,
    }


