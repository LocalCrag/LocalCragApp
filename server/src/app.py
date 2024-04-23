import os

from flask import Flask

from api import configure_api
from config.env_var_config import overwrite_config_by_env_vars
from error_handling.http_error_handlers import setup_http_error_handlers
from error_handling.jwt_error_handlers import setup_jwt_error_handlers
from error_handling.webargs_error_handlers import setup_webargs_error_handlers
from extensions import db, jwt, ma, migrate, cors, scheduler
from models.revoked_token import RevokedToken
from schedulers import start_schedulers


def register_extensions(application):
    db.init_app(application)
    jwt.init_app(application)
    ma.init_app(application)
    migrate.init_app(application, db=db)
    cors.init_app(application, origins=[application.config['FRONTEND_HOST']])
    scheduler.init_app(application)


def configure_extensions(application):
    setup_jwt_error_handlers(jwt)
    configure_api(application)
    setup_http_error_handlers(application)


def create_app():
    application = Flask(__name__,
                        static_url_path='/uploads',
                        static_folder='uploads')
    application.config.from_object('config.default.DefaultConfig')
    if "LOCALCRAG_CONFIG" in os.environ:
        application.config.from_envvar('LOCALCRAG_CONFIG')
    overwrite_config_by_env_vars(application)

    register_extensions(application)

    configure_extensions(application)

    return application


app = create_app()

setup_webargs_error_handlers()

start_schedulers(app)

@jwt.token_in_blocklist_loader
def check_if_token_in_blocklist(_jwt_header, jwt_payload):
    jti = jwt_payload['jti']
    return RevokedToken.is_jti_blocklisted(jti)
