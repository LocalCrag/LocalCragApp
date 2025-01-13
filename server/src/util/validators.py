from models.enums.line_type_enum import LineTypeEnum
from models.scale import Scale


def cross_validate_grade(grade_value, grade_scale, line_type):
    """
    Tests if the given grade name exists in the scale for the line type.
    """
    scale = Scale.query.filter(Scale.type == line_type, Scale.name == grade_scale).first()
    if scale is None:
        return False

    return grade_value in [grade["value"] for grade in scale.grades]


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


def validate_default_scales(args: dict) -> tuple[bool, str]:
    """
    Validates that the requested scales exist for the spcific line types
    """
    if args["defaultBoulderScale"] is not None:
        if (
            Scale.query.filter(Scale.type == LineTypeEnum.BOULDER, Scale.name == args["defaultBoulderScale"]).first()
            is None
        ):
            return False, f"Scale Boulder/{args['defaultBoulderScale']} does not exist."

    if args["defaultSportScale"] is not None:
        if (
            Scale.query.filter(Scale.type == LineTypeEnum.SPORT, Scale.name == args["defaultSportScale"]).first()
            is None
        ):
            return False, f"Scale Sport/{args['defaultSportScale']} does not exist."

    if args["defaultTradScale"] is not None:
        if Scale.query.filter(Scale.type == LineTypeEnum.TRAD, Scale.name == args["defaultTradScale"]).first() is None:
            return False, f"Scale Trad/{args['defaultTradScale']} does not exist."

    return True, ""
