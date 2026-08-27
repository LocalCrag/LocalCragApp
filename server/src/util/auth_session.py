"""Cookie-based session auth and CSRF helpers."""

from __future__ import annotations

from functools import wraps
from typing import TYPE_CHECKING, Optional

from flask import current_app, request
from werkzeug.local import LocalProxy

from error_handling.http_exceptions.unauthorized import Unauthorized
from messages.messages import ResponseMessage
from models.session import Session

if TYPE_CHECKING:
    from models.user import User

SESSION_COOKIE_NAME = "lc_session"
CSRF_COOKIE_NAME = "lc_csrf"
CSRF_HEADER_NAME = "X-CSRF-Token"

# Paths that may mutate state without an authenticated session (or before CSRF exists).
CSRF_EXEMPT_ENDPOINTS = {
    "auth.login_api",
    "auth.forgot_password_api",
    "auth.reset_password_api",
}


def _cookie_kwargs():
    config = current_app.config
    return {
        "httponly": True,
        "secure": bool(config.get("SESSION_COOKIE_SECURE", True)),
        "samesite": config.get("SESSION_COOKIE_SAMESITE", "Lax"),
        "path": "/",
        "max_age": int(config["SESSION_LIFETIME"].total_seconds()),
    }


def _csrf_cookie_kwargs():
    kwargs = _cookie_kwargs()
    kwargs["httponly"] = False
    return kwargs


def set_session_cookies(response, session: Session):
    response.set_cookie(SESSION_COOKIE_NAME, session.id, **_cookie_kwargs())
    csrf_kwargs = _csrf_cookie_kwargs()
    response.set_cookie(CSRF_COOKIE_NAME, session.csrf_token, **csrf_kwargs)
    return response


def clear_session_cookies(response):
    kwargs = {
        "path": "/",
        "secure": bool(current_app.config.get("SESSION_COOKIE_SECURE", True)),
        "samesite": current_app.config.get("SESSION_COOKIE_SAMESITE", "Lax"),
    }
    response.delete_cookie(SESSION_COOKIE_NAME, **kwargs)
    response.delete_cookie(CSRF_COOKIE_NAME, **kwargs)
    return response


def create_session_for_user(user: User) -> Session:
    return Session.create_for_user(user, current_app.config["SESSION_LIFETIME"])


_REQUEST_SESSION_KEY = "lc.auth_session"
_REQUEST_USER_KEY = "lc.current_user"
_REQUEST_LOADED_KEY = "lc.auth_loaded"


def load_request_session() -> Optional[Session]:
    """
    Resolve the current browser session from the HttpOnly cookie.
    Cached on the current request (not flask.g, which outlives requests in tests).
    """
    environ = request.environ
    if environ.get(_REQUEST_LOADED_KEY):
        return environ.get(_REQUEST_SESSION_KEY)
    raw_id = request.cookies.get(SESSION_COOKIE_NAME)
    session = Session.find_valid(raw_id)
    environ[_REQUEST_SESSION_KEY] = session
    environ[_REQUEST_USER_KEY] = session.user if session is not None else None
    environ[_REQUEST_LOADED_KEY] = True
    return session


def clear_request_session_cache():
    """Drop the request-local session after logout/revocation."""
    request.environ[_REQUEST_SESSION_KEY] = None
    request.environ[_REQUEST_USER_KEY] = None
    request.environ[_REQUEST_LOADED_KEY] = True


def get_current_user() -> Optional[User]:
    load_request_session()
    return request.environ.get(_REQUEST_USER_KEY)


current_user = LocalProxy(get_current_user)


def require_csrf_if_authenticated():
    """
    Enforce double-submit CSRF for mutating requests when a session cookie is present.
    """
    if request.method in ("GET", "HEAD", "OPTIONS", "TRACE"):
        return
    if request.endpoint in CSRF_EXEMPT_ENDPOINTS:
        return

    session = load_request_session()
    if session is None:
        return

    header_token = request.headers.get(CSRF_HEADER_NAME)
    cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
    if not header_token or not cookie_token or header_token != cookie_token or header_token != session.csrf_token:
        raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)


def session_required(optional: bool = False, admin: bool = False, moderator: bool = False, member: bool = False):
    """Require a valid session cookie unless optional=True. Optional role flags must all match."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            session = load_request_session()
            if session is None:
                if optional:
                    return fn(*args, **kwargs)
                raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
            user = get_current_user()
            if admin and not user.admin:
                raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
            if moderator and not user.moderator:
                raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
            if member and not user.member:
                raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def verify_session_in_request(optional: bool = False):
    """
    Load the session into request context.
    Returns True if authenticated, False if optional and unauthenticated.
    """
    session = load_request_session()
    if session is None:
        if optional:
            return False
        raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
    return True


def get_session_identity() -> Optional[str]:
    user = get_current_user()
    return user.email if user else None


def get_session_claims() -> dict:
    user = get_current_user()
    if user is None:
        return {}
    return {
        "admin": bool(user.admin),
        "moderator": bool(user.moderator),
        "member": bool(user.member),
        "superadmin": bool(user.superadmin),
    }
