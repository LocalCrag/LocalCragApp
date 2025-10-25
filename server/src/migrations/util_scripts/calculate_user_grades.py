from app import app
from models.line import Line
from util.voting import update_grades_and_rating


def calculate_user_grades():
    """
    Calculate user grades after a migration to 4306dc5f0c18
    """
    with app.app_context():
        lines = list(Line.query.all())
        print(f"Calculating user grades for {len(lines)} lines")
        for i, line in enumerate(lines):
            print(f"Progress: {i}/{len(lines)}", end="\r")
            update_grades_and_rating(line.id)
        print("\nDone")


if __name__ == "__main__":
    calculate_user_grades()
