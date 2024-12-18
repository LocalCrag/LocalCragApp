from app import app
from extensions import db
from models.scale import GRADES, Scale, GRADE_BRACKETS


def add_scales():
    """
    Adds the hardcoded grades to the database
    """
    with app.app_context():
        for line_type, lt_grades in GRADES.items():
            for name, grades in lt_grades.items():
                if Scale.query.filter(Scale.type == line_type, Scale.name == name).count() == 0:
                    new_grades = Scale()
                    new_grades.type = line_type
                    new_grades.name = name
                    new_grades.grades = grades
                    new_grades.grade_brackets = GRADE_BRACKETS[line_type][name]
                    db.session.add(new_grades)
                    db.session.commit()
                    print(f"Added grades {name} for line type {line_type}")


if __name__ == "__main__":
    add_scales()
