from marshmallow_schemas.search_schema import (
    area_search_schema,
    crag_search_schema,
    line_search_schema,
    sector_search_schema,
    user_search_schema,
)
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from models.user import User


def serialize_search_result(object_type: str, object_id):
    if object_type == "Crag":
        obj = Crag.query.filter_by(id=object_id).first()
        return {"type": "CRAG", "item": crag_search_schema.dump(obj)} if obj else None
    if object_type == "Sector":
        obj = Sector.query.filter_by(id=object_id).first()
        return {"type": "SECTOR", "item": sector_search_schema.dump(obj)} if obj else None
    if object_type == "Area":
        obj = Area.query.filter_by(id=object_id).first()
        return {"type": "AREA", "item": area_search_schema.dump(obj)} if obj else None
    if object_type == "Line":
        obj = Line.query.filter_by(id=object_id).first()
        return {"type": "LINE", "item": line_search_schema.dump(obj)} if obj else None
    if object_type == "User":
        obj = User.query.filter_by(id=object_id).first()
        return {"type": "USER", "item": user_search_schema.dump(obj)} if obj else None
    return None
