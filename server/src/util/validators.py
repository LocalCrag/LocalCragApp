from models.scale import Scale


def cross_validate_grade(grade_value, grade_scale, line_type):
    """
    Tests if the given grade name exists in the scale for the line type.
    """
    scale = Scale.query.filter(Scale.line_type == line_type, Scale.name == grade_scale).first()
    if scale is None:
        return False

    return grade_value in [grade.value for grade in scale.grades]


def validate_order_payload(new_order, items):
    """
    Checks if the new order list can match the data that is to be ordered.
    """
    order_indexes = list(new_order.values())
    order_indexes.sort()
    all_integer = all(isinstance(x, int) for x in order_indexes)
    correct_length = len(new_order.items()) == len(items)
    correct_start = order_indexes[0] == 0
    correct_end = order_indexes[-1] == len(order_indexes) - 1
    no_duplicates = len(order_indexes) == len(set(order_indexes))
    if not (correct_length and all_integer and correct_start and correct_end and no_duplicates):
        return False
    return True


def color_validator(color: str):
    try:
        return len(color) == 7 and color[0] == "#" and int(color[1:], 16) >= 0 and "x" not in color.lower()
    except ValueError:
        return False
