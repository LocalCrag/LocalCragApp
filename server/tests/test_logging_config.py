import logging

from app import app
from util.logging_config import (
    configure_app_logging,
    configure_standalone_logging,
    resolve_log_level,
)


def test_resolve_log_level_defaults_to_info():
    assert resolve_log_level(None) == logging.INFO
    assert resolve_log_level("debug") == logging.DEBUG
    assert resolve_log_level("unknown") == logging.INFO


def test_configure_app_logging_sets_flask_logger():
    app.config["LOG_LEVEL"] = "DEBUG"
    configure_app_logging(app)
    assert app.logger.level == logging.DEBUG
    assert app.logger.handlers


def test_configure_standalone_logging_sets_root_logger():
    configure_standalone_logging(level="WARNING")
    assert logging.getLogger().level == logging.WARNING
