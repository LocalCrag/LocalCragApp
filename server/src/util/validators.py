from models.grades import GRADES


def cross_validate_grade(grade_name, grade_scale, line_type):
    """
    Tests if the given grade name exists in the scale for the line type.
    """
    if line_type not in GRADES:
        return False
    if grade_scale not in GRADES[line_type]:
        return False
    if grade_name not in [g['name'] for g in GRADES[line_type][grade_scale]]:
        return False
    return True
