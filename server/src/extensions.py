from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_continuum import make_versioned
from sqlalchemy_continuum.plugins import FlaskPlugin

jwt = JWTManager()

db = SQLAlchemy()

ma = Marshmallow()

migrate = Migrate(compare_type=True)

cors = CORS()

from util.continuum import current_user_id_factory  # noqa: E402

make_versioned(plugins=[FlaskPlugin(current_user_id_factory=current_user_id_factory)])
