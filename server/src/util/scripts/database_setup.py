import logging
import warnings

warnings.warn(
    "This module is deprecated and will be removed in version 2.0. " "Database setup has been moved to migrations.",
    DeprecationWarning,
    stacklevel=2,
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.warning(
        "This module is deprecated and will be removed in version 2.0. " "Database setup has been moved to migrations."
    )
