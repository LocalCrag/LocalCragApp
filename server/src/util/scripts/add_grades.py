from app import app
from extensions import db
from models.grades import GRADES, Grades


def add_grades():
    """
    Adds the hardcoded grades to the database
    """
    with app.app_context():
        for line_type, lt_grades in GRADES.items():
            for name, grades in lt_grades.items():
                if Grades.query.filter(Grades.type == line_type, Grades.name == name).count() == 0:
                    new_grades = Grades()
                    new_grades.type = line_type
                    new_grades.name = name
                    new_grades.grades = grades
                    db.session.add(new_grades)
                    db.session.commit()
                    print(f"Added grades {name} for line type {line_type}")


if __name__ == "__main__":
    add_grades()
