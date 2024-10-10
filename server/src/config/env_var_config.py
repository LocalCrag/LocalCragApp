import os


def overwrite_config_by_env_vars(app):
    var_names = [
        'SQLALCHEMY_DATABASE_URI',
        'SECRET_KEY',
        'JWT_SECRET_KEY',
        'SYSTEM_EMAIL',
        'SMTP_HOST',
        'SMTP_USER',
        'SMTP_PASSWORD',
        'SMTP_PORT',
        'SMTP_TYPE',
        'REGION',
        'SPACES_SECRET_KEY',
        'SPACES_ACCESS_KEY',
        'SPACES_ENDPOINT',
        'SPACES_REGION',
        'SPACES_BUCKET',
        'SPACES_ACCESS_ENDPOINT',
        'SPACES_ADDRESSING',
        'FRONTEND_HOST',
        'SENTRY_DSN',
        'SENTRY_ENABLED'
    ]
    for var_name in var_names:
        if os.environ.get(var_name):
            app.config[var_name] = os.environ.get(var_name)
