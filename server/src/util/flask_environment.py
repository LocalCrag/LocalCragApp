import os
from functools import wraps

from flask import Flask, abort, current_app


def is_development_mode(app: Flask | None = None) -> bool:
    """True for local/dev servers; false for production (gunicorn) and tests by default."""
    flask_env = os.environ.get("FLASK_ENV")
    if flask_env == "production":
        return False
    if flask_env == "development":
        return True
    # ``flask run`` with ``FLASK_DEBUG=1`` (e.g. docker-compose.dev.yml)
    if app is not None and app.debug:
        return True
    return False


def development_only(fn):
    """Allow the route only in development (``FLASK_ENV=development`` or ``FLASK_DEBUG``)."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not is_development_mode(current_app):
            abort(404)
        return fn(*args, **kwargs)

    return wrapper
