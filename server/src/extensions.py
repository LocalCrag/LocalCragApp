from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_marshmallow import Marshmallow
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

jwt = JWTManager()

db = SQLAlchemy()

ma = Marshmallow()

migrate = Migrate(compare_type=True)

cors = CORS()
