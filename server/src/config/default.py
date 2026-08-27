from datetime import timedelta


class DefaultConfig(object):
    SQLALCHEMY_DATABASE_URI = "postgresql://root:@127.0.0.1/localcrag"
    SQLALCHEMY_ENGINE_OPTIONS = {"connect_args": {"options": "-c timezone=utc"}}
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = ""
    SESSION_LIFETIME = timedelta(days=30)
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = "Lax"
    ERROR_404_HELP = False
    PRINT_MAILS_TO_CONSOLE = False
    SYSTEM_EMAIL = "YOUR_SYSTEM_EMAIL"
    SMTP_HOST = "YOUR_SMTP_HOST"
    SMTP_USER = "YOUR_SMTP_USER"
    SMTP_PASSWORD = "YOUR_SMTP_PASSWORD"
    SMTP_PORT = "YOUR_SMTP_PORT"
    SMTP_TYPE = None  # smtps, starttls, plain, disabled
    FRONTEND_HOST = None  # Base URL of the SPA
    SUPERADMIN_FIRSTNAME = ""
    SUPERADMIN_LASTNAME = ""
    SUPERADMIN_EMAIL = ""
    CLIENT_MAX_BODY_SIZE = 200
    MAX_FILE_SIZE = 200
    MAX_IMAGE_SIZE = 50
    S3_PASSWORD = None
    S3_USER = None
    S3_ENDPOINT = None
    S3_REGION = None
    S3_BUCKET = None
    S3_ACCESS_ENDPOINT = None
    S3_ADDRESSING = "virtual"
    SENTRY_DSN = ""
    SENTRY_ENABLED = False
    LOG_LEVEL = "INFO"
