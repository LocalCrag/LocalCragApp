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
