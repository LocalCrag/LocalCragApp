from error_handling.http_exceptions.bad_request import BadRequest
from models.enums.line_type_enum import LineTypeEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum
from util.tags import set_tags

TOPO_LINK_OBJECT_TYPES = {"Line", "Area", "Sector", "Crag"}


def _normalize_optional_text(value, *, max_len: int | None = None):
    if value in (None, ""):
        return None
    if not isinstance(value, str):
        raise BadRequest("Expected a string value.")
    text = value.strip()
    if not text:
        return None
    if max_len is not None and len(text) > max_len:
        raise BadRequest(f"Text must be at most {max_len} characters.")
    return text


def _validate_coordinate(value, name: str) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError) as exc:
        raise BadRequest(f"{name} must be a number.") from exc
    if name == "lat" and not -90 <= number <= 90:
        raise BadRequest("lat must be between -90 and 90.")
    if name == "lng" and not -180 <= number <= 180:
        raise BadRequest("lng must be between -180 and 180.")
    return number


def normalize_parking_sites(raw) -> list[dict]:
    """Validate and normalize parkingSites payload items."""
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise BadRequest("parkingSites must be a list.")
    normalized = []
    seen_ids = set()
    for item in raw:
        if not isinstance(item, dict):
            raise BadRequest("Each parking site must be an object.")
        site_id = item.get("id")
        if not isinstance(site_id, str) or not site_id.strip():
            raise BadRequest("Each parking site requires a non-empty id.")
        site_id = site_id.strip()
        if site_id in seen_ids:
            raise BadRequest("parkingSites ids must be unique.")
        seen_ids.add(site_id)
        lat = _validate_coordinate(item.get("lat"), "lat")
        lng = _validate_coordinate(item.get("lng"), "lng")
        normalized.append(
            {
                "id": site_id,
                "lat": lat,
                "lng": lng,
                "title": _normalize_optional_text(item.get("title"), max_len=120),
                "description": _normalize_optional_text(item.get("description")),
            }
        )
    return normalized


def _validate_linestring(geometry) -> dict:
    if not isinstance(geometry, dict):
        raise BadRequest("path geometry must be an object.")
    if geometry.get("type") != "LineString":
        raise BadRequest("path geometry.type must be LineString.")
    coordinates = geometry.get("coordinates")
    if not isinstance(coordinates, list) or len(coordinates) < 2:
        raise BadRequest("path LineString requires at least 2 positions.")
    normalized_coords = []
    for position in coordinates:
        if not isinstance(position, (list, tuple)) or len(position) < 2:
            raise BadRequest("Each LineString position must be [lng, lat].")
        lng = _validate_coordinate(position[0], "lng")
        lat = _validate_coordinate(position[1], "lat")
        normalized_coords.append([lng, lat])
    return {"type": "LineString", "coordinates": normalized_coords}


def normalize_paths(raw) -> list[dict]:
    """Validate and normalize paths payload items."""
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise BadRequest("paths must be a list.")
    normalized = []
    seen_ids = set()
    for item in raw:
        if not isinstance(item, dict):
            raise BadRequest("Each path must be an object.")
        path_id = item.get("id")
        if not isinstance(path_id, str) or not path_id.strip():
            raise BadRequest("Each path requires a non-empty id.")
        path_id = path_id.strip()
        if path_id in seen_ids:
            raise BadRequest("paths ids must be unique.")
        seen_ids.add(path_id)
        normalized.append(
            {
                "id": path_id,
                "title": _normalize_optional_text(item.get("title"), max_len=120),
                "description": _normalize_optional_text(item.get("description")),
                "geometry": _validate_linestring(item.get("geometry")),
            }
        )
    return normalized


def apply_rock_explorer_metadata(entity, data: dict) -> None:
    """Copy shared rock-explorer metadata fields from parsed request data onto an entity."""
    grade_min = data["gradeValueMin"] if "gradeValueMin" in data else getattr(entity, "grade_value_min", None)
    grade_max = data["gradeValueMax"] if "gradeValueMax" in data else getattr(entity, "grade_value_max", None)
    if grade_min is not None and grade_max is not None and grade_max < grade_min:
        raise BadRequest("gradeValueMax must be greater than or equal to gradeValueMin.")

    if "title" in data:
        title = data["title"]
        entity.title = title.strip() if isinstance(title, str) and title.strip() else None
    if "description" in data:
        description = data["description"]
        entity.description = description if description not in (None, "") else None
    if "potential" in data:
        entity.potential = RockExplorerPotentialEnum(data["potential"]) if data["potential"] else None
    if "rockQuality" in data:
        entity.rock_quality = RockExplorerRockQualityEnum(data["rockQuality"]) if data["rockQuality"] else None
    if "rockType" in data:
        entity.rock_type = RockExplorerRockTypeEnum(data["rockType"]) if data["rockType"] else None
    if "gradeLineType" in data:
        entity.grade_line_type = LineTypeEnum(data["gradeLineType"]) if data["gradeLineType"] else None
    if "gradeScale" in data:
        entity.grade_scale = data["gradeScale"] or None
    if "gradeValueMin" in data:
        entity.grade_value_min = data["gradeValueMin"]
    if "gradeValueMax" in data:
        entity.grade_value_max = data["gradeValueMax"]
    if "accessIssues" in data:
        entity.access_issues = list(data["accessIssues"] or [])
    if "parkingSites" in data:
        entity.parking_sites = normalize_parking_sites(data["parkingSites"])
    if "paths" in data:
        entity.paths = normalize_paths(data["paths"])
    if "topoLinks" in data:
        set_tags(
            entity,
            data["topoLinks"] or [],
            attribute="topo_links",
            allowed_types=TOPO_LINK_OBJECT_TYPES,
        )


def rock_explorer_gallery_image_ids_subquery():
    """Gallery image IDs carrying at least one rock explorer tag (member-only content)."""
    from sqlalchemy import select

    from models.gallery_image import gallery_image_tags
    from models.tag import Tag
    from util.generic_relationships import ROCK_EXPLORER_OBJECT_TYPES

    return (
        select(gallery_image_tags.c.gallery_image_id)
        .join(Tag, gallery_image_tags.c.tag_id == Tag.id)
        .filter(Tag.object_type.in_(ROCK_EXPLORER_OBJECT_TYPES))
    )
