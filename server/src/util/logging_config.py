import logging
import os
import sys
from typing import Optional

DEFAULT_LOG_FORMAT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"
DEFAULT_DATE_FORMAT = "%Y-%m-%dT%H:%M:%S%z"


def resolve_log_level(level: Optional[str] = None) -> int:
    raw = (level or os.environ.get("LOG_LEVEL", "INFO")).upper()
    return getattr(logging, raw, logging.INFO)


def _build_handler() -> logging.StreamHandler:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(DEFAULT_LOG_FORMAT, datefmt=DEFAULT_DATE_FORMAT))
    return handler


def configure_app_logging(app, *, level: Optional[str] = None) -> None:
    """Configure Flask and root logging for the application process."""
    log_level = resolve_log_level(level or app.config.get("LOG_LEVEL"))
    handler = _build_handler()

    app.logger.handlers.clear()
    app.logger.addHandler(handler)
    app.logger.setLevel(log_level)
    app.logger.propagate = False

    logging.basicConfig(level=log_level, handlers=[handler], force=True)
    logging.getLogger("werkzeug").setLevel(logging.WARNING)


def configure_standalone_logging(*, level: Optional[str] = None) -> None:
    """Configure root logging for standalone scripts (no Flask app)."""
    log_level = resolve_log_level(level)
    logging.basicConfig(level=log_level, handlers=[_build_handler()], force=True)
