from functools import wraps

from flask import g
from flask_jwt_extended import get_jwt_identity

from error_handling.http_exceptions.unauthorized import Unauthorized
from messages.messages import ResponseMessage
from models.user import User


def check_user_authorized():
    """
    Checks if the requesting user is authorized to perform an action. Usually this means checking that he is not locked
    and activated.
    """

    def outer_wrapper(fn):
        @wraps(fn)
        def inner_wrapper(*args, **kwargs):
            user = User.find_by_email(get_jwt_identity())
            if not user:
                raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
            if user.deleted:
                raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
            if user.locked:
                raise Unauthorized(ResponseMessage.USER_LOCKED.value)
            g.user = user

            return fn(*args, **kwargs)

        return inner_wrapper

    return outer_wrapper
