from functools import wraps

from error_handling.http_exceptions.forbidden import Forbidden
from messages.messages import ResponseMessage
from models.instance_settings import InstanceSettings


def is_gym_mode(value=True):
    """
    Checks if gym_mode is set to the given value
    """

    def outer_wrapper(fn):
        @wraps(fn)
        def inner_wrapper(*args, **kwargs):
            instance_settings = InstanceSettings.return_it()
            if instance_settings.gym_mode != value:
                raise Forbidden(ResponseMessage.FORBIDDEN.value)

            return fn(*args, **kwargs)

        return inner_wrapper

    return outer_wrapper