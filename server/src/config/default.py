from datetime import timedelta


class DefaultConfig(object):
    SQLALCHEMY_DATABASE_URI = 'postgresql://root:@127.0.0.1/localcrag'
    SQLALCHEMY_ENGINE_OPTIONS = {"connect_args": {"options": "-c timezone=utc"}}
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'thisKeyIsNotSecretChangeIt'
    JWT_SECRET_KEY = 'thisKeyIsNotSecretChangeIt'
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']  # todo isn't this now blocklist?
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=10)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    ERROR_404_HELP = False
    SYSTEM_EMAIL = 'YOUR_SYSTEM_EMAIL'
    SMTP_HOST = 'YOUR_SMTP_HOST'
    SMTP_USER = 'YOUR_SMTP_USER'
    SMTP_PASSWORD = 'YOUR_SMTP_PASSWORD'
    SMTP_PORT = 'YOUR_SMTP_PORT'
    FRONTEND_HOST = 'https://localcrag.de'
    CORS_ORIGINS = 'https://localcrag.de'
    SUPERADMIN_FIRSTNAME = 'Felix'
    SUPERADMIN_LASTNAME = 'Engelmann'
    SUPERADMIN_EMAIL = 'localcrag@fengelmann.de'
    CLIENT_MAX_BODY_SIZE = 200
    MAX_FILE_SIZE = 200
    MAX_IMAGE_SIZE = 20
    REGION = 'Tessin'
