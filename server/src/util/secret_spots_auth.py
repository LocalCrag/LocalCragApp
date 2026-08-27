from flask import has_request_context

from util.auth_session import get_current_user


def get_show_secret():
    """
    Returns whether a user has access to secret spots.
    """
    if not has_request_context():
        return False

    user = get_current_user()
    return bool(user and (user.admin or user.moderator or user.member))
