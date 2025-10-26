def validate_config(config):
    # Check token presence
    if not config["SECRET_KEY"]:
        raise Exception("Invalid config: SECRET_KEY needs to be set.")
    if not config["JWT_SECRET_KEY"]:
        raise Exception("Invalid config: JWT_SECRET_KEY needs to be set.")

    # Validate frontend host matches format
    if config["FRONTEND_HOST"][-1] != "/":
        raise Exception("Invalid config: FRONTEND_HOST needs to end in a slash.")

    # Check Sentry configuration
    if config["SENTRY_ENABLED"] and not config["SENTRY_DSN"]:
        raise Exception("Invalid config: SENTRY_DSN needs to be set if SENTRY_ENABLED is True.")

    # Make sure a superadmin is configured
    if not config["SUPERADMIN_EMAIL"] or not config["SUPERADMIN_FIRSTNAME"] or not config["SUPERADMIN_LASTNAME"]:
        raise Exception(
            "Invalid config: SUPERADMIN_EMAIL, SUPERADMIN_FIRSTNAME and SUPERADMIN_LASTNAME need to be set."
        )

    # Make sure we have a database connection string
    if not config["SQLALCHEMY_DATABASE_URI"]:
        raise Exception("Invalid config: SQLALCHEMY_DATABASE_URI needs to be set.")

    # Validate SMTP configuration if not printing mails to console
    if not config["PRINT_MAILS_TO_CONSOLE"]:
        if config["SMTP_TYPE"] not in ["smtps", "starttls", "plain", "disabled"]:
            raise Exception("Invalid config: SMTP_TYPE needs to be one of smtps, starttls, plain, disabled.")
        if config["SMTP_TYPE"] != "disabled":
            if not config["SMTP_HOST"] or not config["SMTP_PORT"]:
                raise Exception(
                    "Invalid config: SMTP_HOST and SMTP_PORT need to be set if PRINT_MAILS_TO_CONSOLE is"
                    " False and SMTP_TYPE is not disabled."
                )
            if config["SMTP_TYPE"] in ["smtps", "starttls", "plain"]:
                if not config["SMTP_USER"] or not config["SMTP_PASSWORD"]:
                    raise Exception(
                        "Invalid config: SMTP_USER and SMTP_PASSWORD need to be set if PRINT_MAILS_TO_CONSOLE is"
                        " False and SMTP_TYPE is smtps, starttls or plain."
                    )
            if not config["SYSTEM_EMAIL"]:
                raise Exception("Invalid config: SYSTEM_EMAIL needs to be set if PRINT_MAILS_TO_CONSOLE is False.")

    # Validate S3 configuration
    if config["S3_ENDPOINT"] and (not config["S3_BUCKET"] or not config["S3_USER"] or not config["S3_PASSWORD"]):
        raise Exception("Invalid config: S3_BUCKET, S3_USER and S3_PASSWORD " "need to be set when S3_ENDPOINT is set.")
    if config["S3_ENDPOINT"] and config["S3_ADDRESSING"] not in ["virtual", "path"]:
        raise Exception("Invalid config: S3_ADDRESSING needs to be one of virtual or path.")
