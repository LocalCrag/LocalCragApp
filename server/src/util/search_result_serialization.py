from marshmallow_schemas.search_schema import (
    area_search_schema,
    crag_search_schema,
    line_search_schema,
    rock_explorer_feature_search_schema,
    sector_search_schema,
    user_search_schema,
)
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.rock_explorer_feature import RockExplorerFeature
from models.sector import Sector
from models.user import User

_SEARCHABLE_TYPE_TO_OBJECT_TYPE = {
    "CRAG": "Crag",
    "SECTOR": "Sector",
    "AREA": "Area",
    "LINE": "Line",
    "USER": "User",
    "ROCK_EXPLORER_FEATURE": "RockExplorerFeature",
}


def searchable_type_to_object_type(type_value: str) -> str | None:
    return _SEARCHABLE_TYPE_TO_OBJECT_TYPE.get(type_value)


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
    if object_type == "RockExplorerFeature":
        obj = RockExplorerFeature.query.filter_by(id=object_id).first()
        return {"type": "ROCK_EXPLORER_FEATURE", "item": rock_explorer_feature_search_schema.dump(obj)} if obj else None
    return None
