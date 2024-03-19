import os


class EnvVarConfig(object):
    SQLALCHEMY_DATABASE_URI = os.environ.get("SQLALCHEMY_DATABASE_URI")
    SECRET_KEY = os.environ.get("SECRET_KEY")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    SYSTEM_EMAIL = os.environ.get("SYSTEM_EMAIL")
    SMTP_HOST = os.environ.get("SMTP_HOST")
    SMTP_USER = os.environ.get("SMTP_USER")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
    SMTP_PORT = os.environ.get("SMTP_PORT")
    REGION = os.environ.get("REGION")
    SPACES_SECRET_KEY = os.environ.get("SPACES_SECRET_KEY")
    SPACES_ACCESS_KEY = os.environ.get("SPACES_ACCESS_KEY")
    SPACES_ENDPOINT = os.environ.get("SPACES_ENDPOINT")
    SPACES_REGION = os.environ.get("SPACES_REGION")
    SPACES_BUCKET = os.environ.get("SPACES_BUCKET")
    FRONTEND_HOST = os.environ.get("FRONTEND_HOST")