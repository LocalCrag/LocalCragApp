import uuid

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect
from sqlalchemy.orm import make_transient
from sqlalchemy.util import symbol

from api import configure_api
from error_handling.http_error_handlers import setup_http_error_handlers
from error_handling.jwt_error_handlers import setup_jwt_error_handlers
from error_handling.webargs_error_handlers import setup_webargs_error_handlers
from extensions import db, jwt, ma, migrate, cors
from models.experiment import Experiment
from models.revoked_token import RevokedToken
from util.application_object_util import add_app_utils
from util.class_registry_util import add_class_registry_utils


def register_extensions(application):
    db.init_app(application)
    jwt.init_app(application)
    ma.init_app(application)
    migrate.init_app(application, db=db)
    cors.init_app(application, resources={r"/api/*": {"origins": application.config['FRONTEND_HOST']}})




def configure_extensions(application):
    setup_jwt_error_handlers(jwt)
    configure_api(application)
    setup_http_error_handlers(application)


def create_app():
    application = Flask(__name__,
                        static_url_path='/uploads',
                        static_folder='uploads')
    application.config.from_object('config.default.DefaultConfig')
    application.config.from_envvar('ACTION_DIRECTE_CONFIG')

    register_extensions(application)

    add_class_registry_utils()

    add_app_utils(application)

    configure_extensions(application)

    return application


app = create_app()

setup_webargs_error_handlers()


@jwt.token_in_blocklist_loader
def check_if_token_in_blocklist(_jwt_header, jwt_payload):
    jti = jwt_payload['jti']
    return RevokedToken.is_jti_blocklisted(jti)
