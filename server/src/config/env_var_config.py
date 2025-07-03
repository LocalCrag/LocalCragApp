import os


def overwrite_config_by_env_vars(app):

    # Map legacy environment variable names to new ones (for backwards compatibility)
    legacy_var_name_mapping = {
        "S3_PASSWORD": "SPACES_SECRET_KEY",
        "S3_USER": "SPACES_ACCESS_KEY",
        "S3_ENDPOINT": "SPACES_ENDPOINT",
        "S3_REGION": "SPACES_REGION",
        "S3_BUCKET": "SPACES_BUCKET",
        "S3_ACCESS_ENDPOINT": "SPACES_ACCESS_ENDPOINT",
        "S3_ADDRESSING": "SPACES_ADDRESSING",
    }

    var_names = [
        "SQLALCHEMY_DATABASE_URI",
        "SECRET_KEY",
        "JWT_SECRET_KEY",
        "SYSTEM_EMAIL",
        "SMTP_HOST",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "SMTP_PORT",
        "SMTP_TYPE",
        "S3_PASSWORD",
        "S3_USER",
        "S3_ENDPOINT",
        "S3_REGION",
        "S3_BUCKET",
        "S3_ACCESS_ENDPOINT",
        "S3_ADDRESSING",
        "FRONTEND_HOST",
        "SENTRY_DSN",
        "SENTRY_ENABLED",
        "CRON_ACCESS_TOKEN",
        "SUPERADMIN_EMAIL",
        "SUPERADMIN_FIRSTNAME",
        "SUPERADMIN_LASTNAME",
    ]

    for var_name in var_names:
        if os.environ.get(var_name):
            app.config[var_name] = os.environ.get(var_name)
        elif var_name in legacy_var_name_mapping and os.environ.get(legacy_var_name_mapping[var_name]):
            app.config[var_name] = os.environ.get(legacy_var_name_mapping[var_name])
