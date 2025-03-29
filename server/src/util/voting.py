import bisect
import statistics

from extensions import db
from models.ascent import Ascent
from models.line import Line
from models.scale import Scale


def update_grades_and_rating(line_id: str, min_ascents: int):
    """
    Given a line id, processes all the data from ascents to update line grade and rating
    """
    print(f"update_grades_and_rating: {line_id} {min_ascents}")
    if min_ascents > 0:
        ascents = Ascent.query.filter(Ascent.line_id == line_id).all()
        if len(ascents) >= min_ascents:
            line = Line.find_by_id(line_id)
            scale = Scale.query.filter_by(type=line.type, name=line.grade_scale).first()
            all_grades = sorted([g["value"] for g in scale.grades])
            # hard and soft ratings get values 40% on the way to the next grade
            soft_vals = {
                g: g + (g2 - g) * 0.4 for g, g2 in zip(all_grades, [all_grades[0] - 1] + all_grades)
            }  # zip() truncates to length of shortest iterable
            hard_vals = {g: g + (g2 - g) * 0.4 for g, g2 in zip(all_grades, all_grades[1:] + [all_grades[-1] + 1])}

            def get_ascent_grade(a: Ascent):
                if a.soft:
                    return soft_vals[a.grade_value]
                if a.hard:
                    return hard_vals[a.grade_value]
                return a.grade

            grades = list(map(get_ascent_grade, ascents))
            ratings = [ascent.rating for ascent in ascents]
            mean_grade = statistics.mean(grades)
            mean_rating = statistics.mean(ratings)

            # Round to nearest
            lower_grade_index = bisect.bisect_right(all_grades, mean_grade)
            if lower_grade_index > len(all_grades) - 1:
                lower_grade_index = len(all_grades) - 1
            candidate1 = all_grades[lower_grade_index]
            candidate2 = all_grades[lower_grade_index + 1 if lower_grade_index + 1 < len(grades) else len(grades)]
            if abs(mean_grade - candidate1) < abs(mean_grade - candidate2):
                line.grade_value = candidate1
            else:
                line.grade_value = candidate2
            line.rating = round(mean_rating)

            db.session.add(line)
            db.session.commit()
