from functools import wraps

from flask import has_request_context
from flask_jwt_extended import get_jwt, verify_jwt_in_request

from error_handling.http_exceptions.unauthorized import Unauthorized
from messages.messages import ResponseMessage
from util.secret_service import SecretService


def current_user_is_moderator() -> bool:
    """Return whether the current request is authenticated as a moderator."""
    if not has_request_context():
        return False
    has_jwt = bool(verify_jwt_in_request(optional=True))
    if not has_jwt:
        return False
    return bool(get_jwt().get("moderator"))


def check_auth_claims(admin=False, moderator=False, member=False):
    """
    Checks if the requesting user is authorized to perform an action. Usually this means checking that he exists
    and is activated.
    """

    def outer_wrapper(fn):
        @wraps(fn)
        def inner_wrapper(*args, **kwargs):
            claims = get_jwt()
            if admin and not claims["admin"]:
                raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
            if moderator and not claims["moderator"]:
                raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
            if member and not claims["member"]:
                raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)

            return fn(*args, **kwargs)

        return inner_wrapper

    return outer_wrapper


def check_secret_spot_permission(item):
    """
    Checks for a given Line, Area, Sector or Crag if the requesting user has secret spot permissions to view it.
    """
    if item.secret:
        if not SecretService.can_view_secrets():
            raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
