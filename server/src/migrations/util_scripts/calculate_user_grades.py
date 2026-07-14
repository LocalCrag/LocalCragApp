import logging

from app import app
from models.line import Line
from util.voting import update_grades_and_rating

logger = logging.getLogger(__name__)


def calculate_user_grades():
    """
    Calculate user grades after a migration to 4306dc5f0c18
    """
    with app.app_context():
        lines = list(Line.query.all())
        logger.info("Calculating user grades for %s lines", len(lines))
        for i, line in enumerate(lines, start=1):
            update_grades_and_rating(line.id)
            if i == len(lines) or i % 100 == 0:
                logger.info("Progress: %s/%s lines processed", i, len(lines))
        logger.info("Finished calculating user grades")


if __name__ == "__main__":
    calculate_user_grades()
