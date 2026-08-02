from error_handling.http_exceptions.not_found import NotFound
from models.tag import Tag
from util.generic_relationships import check_object_exists


def set_tags(owner, tag_data, *, attribute: str = "tags", allowed_types: set[str] | None = None) -> None:
    """
    Replace an owner's tag collection (M2M to Tag) from [{objectType, objectId}, ...].

    Tags are find-or-created by (object_type, object_id), matching gallery write semantics.
    """
    tags = []
    seen = set()
    for item in tag_data or []:
        object_type = item.get("objectType")
        object_id = item.get("objectId")
        if not object_type or not object_id:
            continue
        if allowed_types is not None and object_type not in allowed_types:
            continue
        key = (object_type, str(object_id))
        if key in seen:
            continue
        seen.add(key)
        tag = Tag.query.filter_by(object_type=object_type, object_id=object_id).first()
        if not tag:
            if not check_object_exists(object_type, object_id):
                raise NotFound(f"{object_type} with id {object_id} does not exist.")
            tag = Tag()
            tag.object_type = object_type
            tag.object_id = object_id
        tags.append(tag)
    setattr(owner, attribute, tags)
