import os

import sentry_sdk
from flask import Flask, g

from api import configure_api
from config.env_var_config import overwrite_config_by_env_vars
from config.validate_config import validate_config
from error_handling.http_error_handlers import setup_http_error_handlers
from error_handling.webargs_error_handlers import setup_webargs_error_handlers
from extensions import cors, db, ma, migrate
from schedulers import init_schedulers
from util.auth_session import get_current_user, require_csrf_if_authenticated
from util.file_links import register_file_listeners
from util.flask_environment import is_development_mode
from util.logging_config import configure_app_logging
from util.topo_contribution import register_topo_contribution_listener


def register_extensions(application):
    db.init_app(application)
    ma.init_app(application)
    migrate.init_app(application, db=db)
    cors.init_app(
        application,
        origins=[application.config["FRONTEND_HOST"]],
        supports_credentials=True,
        expose_headers=["X-Topo-Points-Delta"],
    )


def configure_extensions(application):
    configure_api(application)
    setup_http_error_handlers(application)
    application.before_request(require_csrf_if_authenticated)

    # Initialize schedulers only in development environment
    # For production usage, they are initialized in via gunicorn post_fork hook
    # In debug mode, the reloader spawns two processes, so we only want to init once
    if is_development_mode(application) and (not application.debug or os.environ.get("WERKZEUG_RUN_MAIN") == "true"):
        init_schedulers(application)


def init_sentry_sdk(application):
    if application.config["SENTRY_ENABLED"]:
        sentry_sdk.init(
            dsn=application.config["SENTRY_DSN"],
            traces_sample_rate=1.0,
            profiles_sample_rate=1.0,
        )


def create_app():
    application = Flask(__name__, static_url_path="/uploads", static_folder="uploads")
    application.config.from_object("config.default.DefaultConfig")
    if "LOCALCRAG_CONFIG" in os.environ:
        application.config.from_envvar("LOCALCRAG_CONFIG")
    overwrite_config_by_env_vars(application)
    validate_config(application.config)

    configure_app_logging(application)

    init_sentry_sdk(application)

    register_extensions(application)

    configure_extensions(application)

    register_file_listeners()
    register_topo_contribution_listener()

    @application.after_request
    def add_topo_points_header(response):
        delta = getattr(g, "topo_points_delta", None)
        if not delta or not (200 <= response.status_code < 300):
            return response
        user = get_current_user()
        if user is not None and user.moderator:
            response.headers["X-Topo-Points-Delta"] = str(delta)
        return response

    return application


app = create_app()

setup_webargs_error_handlers()
