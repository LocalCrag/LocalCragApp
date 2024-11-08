from functools import wraps

from flask import request, current_app

from error_handling.http_exceptions.unauthorized import Unauthorized
from models.user import User


def get_access_token_claims(user: User):
    return {
        "admin": user.admin,
        "moderator": user.moderator,
        "member": user.member,
    }


def cron_job_token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get("Authorization")

        # Check if the token is present and matches the expected token
        if not token or token != f"Bearer {current_app.config['CRON_ACCESS_TOKEN']}":
            raise Unauthorized("Invalid token")

        return f(*args, **kwargs)

    return decorated_function