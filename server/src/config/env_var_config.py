import os


def _parse_bool(value: str) -> bool:
    return value.strip().lower() in ("1", "true", "yes", "on")


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
        "SUPERADMIN_EMAIL",
        "SUPERADMIN_FIRSTNAME",
        "SUPERADMIN_LASTNAME",
        "LOG_LEVEL",
        "SESSION_COOKIE_SAMESITE",
        "SESSION_COOKIE_SECURE",
    ]

    bool_vars = {"SENTRY_ENABLED", "SESSION_COOKIE_SECURE"}

    for var_name in var_names:
        raw = None
        if os.environ.get(var_name):
            raw = os.environ.get(var_name)
        elif var_name in legacy_var_name_mapping and os.environ.get(legacy_var_name_mapping[var_name]):
            raw = os.environ.get(legacy_var_name_mapping[var_name])
        if raw is None:
            continue
        if var_name in bool_vars:
            app.config[var_name] = _parse_bool(raw)
        else:
            app.config[var_name] = raw
