from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from models.user import User


def check_object_exists(object_type, object_id):
    """
    Check if an object with the given object_type and object_id exists.
    """
    if object_type == "User":
        return User.query.get(object_id) is not None
    if object_type == "Line":
        return Line.query.get(object_id) is not None
    if object_type == "Area":
        return Area.query.get(object_id) is not None
    if object_type == "Sector":
        return Sector.query.get(object_id) is not None
    if object_type == "Crag":
        return Crag.query.get(object_id) is not None
    return False


def get_object_secret(object_type, object_id):
    """
    Get the secret status of an object with the given object_type and object_id.
    """
    if object_type == "Line":
        return Line.query.get(object_id).secret
    if object_type == "Area":
        return Area.query.get(object_id).secret
    if object_type == "Sector":
        return Sector.query.get(object_id).secret
    if object_type == "Crag":
        return Crag.query.get(object_id).secret
    return False
