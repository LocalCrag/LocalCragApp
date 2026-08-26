from flask import has_request_context

from error_handling.http_exceptions.unauthorized import Unauthorized
from messages.messages import ResponseMessage
from util.auth_session import get_current_user
from util.secret_service import SecretService


def current_user_is_moderator() -> bool:
    """Return whether the current request is authenticated as a moderator."""
    if not has_request_context():
        return False
    user = get_current_user()
    return bool(user and user.moderator)


def current_user_is_member() -> bool:
    """Return whether the current request is authenticated as a member."""
    if not has_request_context():
        return False
    user = get_current_user()
    return bool(user and user.member)


def check_secret_spot_permission(item):
    """
    Checks for a given Line, Area, Sector or Crag if the requesting user has secret spot permissions to view it.
    """
    if item.secret:
        if not SecretService.can_view_secrets():
            raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
