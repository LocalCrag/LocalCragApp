import logging

from sqlalchemy import text

from app import app
from extensions import db
from models.line import Line
from util.voting import update_grades_and_rating

logger = logging.getLogger(__name__)


def recalculate_lines_with_ungraded_ascents():
    """Recompute community grades for lines that include an ungraded tick.

    Grade value 0 used to count toward the mean. Only those lines can change.
    """
    with app.app_context():
        line_ids = [
            row[0]
            for row in db.session.execute(text("SELECT DISTINCT line_id FROM ascents WHERE grade_value = 0")).fetchall()
        ]
        logger.info("Recalculating user grades for %s lines with an ungraded ascent", len(line_ids))
        for i, line_id in enumerate(line_ids, start=1):
            update_grades_and_rating(line_id)
            if i == len(line_ids) or i % 100 == 0:
                logger.info("Progress: %s/%s lines processed", i, len(line_ids))
        logger.info("Finished recalculating user grades")


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
