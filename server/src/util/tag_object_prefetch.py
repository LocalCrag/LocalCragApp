"""Batch-load generic tag targets to avoid N+1 during gallery serialization.

Gallery image tags use ``sqlalchemy_utils.generic_relationship`` (``Tag.object_type`` +
``Tag.object_id``). Eager-loading ``GalleryImage.tags`` still leaves each tag's ``object``
as a separate lookup when Marshmallow serializes ``TagSchema``.

Call :func:`prefetch_tag_objects` on the flattened tag list **after** the gallery query
and **before** schema dump. Tags are grouped by ``object_type``, loaded with one query per
type, then attached via :func:`sqlalchemy.orm.attributes.set_committed_value` so the
generic relationship does not re-query on access.

Supported ``object_type`` values are listed in :data:`_OBJECT_TYPE_MODEL`; unknown types
are skipped.

Typical usage::

    paginated_images = db.paginate(images_query, ...)
    all_tags = [tag for image in paginated_images.items for tag in image.tags]
    prefetch_tag_objects(all_tags)
    return paginated_gallery_images_schema.dump(paginated_images)
"""

from collections import defaultdict

from sqlalchemy.orm.attributes import set_committed_value

from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from models.tag import Tag
from models.user import User

_OBJECT_TYPE_MODEL = {
    "Line": Line,
    "Area": Area,
    "Sector": Sector,
    "Crag": Crag,
    "User": User,
}


def prefetch_tag_objects(tags: list[Tag]) -> None:
    """Load tagged entities in bulk and attach them to ``Tag.object``.

    Runs at most one ``SELECT`` per distinct ``object_type`` present in ``tags``.
    """
    if not tags:
        return

    ids_by_type: dict[str, set] = defaultdict(set)
    for tag in tags:
        if tag.object_type and tag.object_id:
            ids_by_type[tag.object_type].add(tag.object_id)

    objects_by_type_and_id: dict[str, dict] = {}
    for object_type, object_ids in ids_by_type.items():
        model = _OBJECT_TYPE_MODEL.get(object_type)
        if model is None:
            continue
        loaded = model.query.filter(model.id.in_(object_ids)).all()
        objects_by_type_and_id[object_type] = {obj.id: obj for obj in loaded}

    for tag in tags:
        if not tag.object_type or not tag.object_id:
            continue
        obj = objects_by_type_and_id.get(tag.object_type, {}).get(tag.object_id)
        if obj is not None:
            set_committed_value(tag, "object", obj)
