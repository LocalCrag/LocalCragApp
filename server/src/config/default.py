from datetime import timedelta


class DefaultConfig(object):
    SQLALCHEMY_DATABASE_URI = "postgresql://root:@127.0.0.1/localcrag"
    SQLALCHEMY_ENGINE_OPTIONS = {"connect_args": {"options": "-c timezone=utc"}}
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "thisKeyIsNotSecretChangeIt"
    JWT_SECRET_KEY = "thisKeyIsNotSecretChangeIt"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=10)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    ERROR_404_HELP = False
    PRINT_MAILS_TO_CONSOLE = False
    SYSTEM_EMAIL = "YOUR_SYSTEM_EMAIL"
    SMTP_HOST = "YOUR_SMTP_HOST"
    SMTP_USER = "YOUR_SMTP_USER"
    SMTP_PASSWORD = "YOUR_SMTP_PASSWORD"
    SMTP_PORT = "YOUR_SMTP_PORT"
    SMTP_TYPE = "smtps_OR_starttls_OR_plain_OR_disabled"
    FRONTEND_HOST = "https://localcrag.de/"
    SUPERADMIN_FIRSTNAME = ""
    SUPERADMIN_LASTNAME = ""
    SUPERADMIN_EMAIL = ""
    CLIENT_MAX_BODY_SIZE = 200
    MAX_FILE_SIZE = 200
    MAX_IMAGE_SIZE = 50
    SPACES_SECRET_KEY = "test"
    SPACES_ACCESS_KEY = "test"
    SPACES_ENDPOINT = "http://0.0.0.0:4566"
    SPACES_REGION = "eu-central-1"
    SPACES_BUCKET = "lc-test-bucket"
    SPACES_ACCESS_ENDPOINT = None
    SPACES_ADDRESSING = "virtual"
    SENTRY_DSN = ""
    SENTRY_ENABLED = False
    CRON_ACCESS_TOKEN = "thisTokenIsNotSecretChangeIt"
    MIN_VOTING_ASCENTS = 0
