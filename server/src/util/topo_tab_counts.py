"""Comment and gallery image counts for topo entity detail tabs.

Used by hybrid properties on Crag, Sector, Area, Line, and Region so detail schemas
can expose ``commentCount`` and ``imageCount`` for page-title tab pills.

- Comments: root threads on the entity itself (matches ``GetComments`` listing).
- Images: entity tag plus child tags (matches ``GetGalleryImages`` + ``get_child_tags``),
  with secret-gallery filtering via ``SecretService``.

Model imports are deferred inside the helpers to avoid circular imports
(``Comment`` → ``Region``/``Area`` → this module).
"""

from sqlalchemy import func

from extensions import db
from util.secret_service import SecretService


def count_root_comments(object_type: str, object_id) -> int:
    """Count top-level comments for a single topo (or related) entity."""
    from models.comment import Comment

    return int(
        db.session.query(func.count(Comment.id))
        .filter(
            Comment.object_type == object_type,
            Comment.object_id == object_id,
            Comment.parent_id.is_(None),
        )
        .scalar()
        or 0
    )


def count_gallery_images(object_type: str, object_id) -> int:
    """Count distinct gallery images tagged with the entity or its children."""
    from models.gallery_image import GalleryImage, gallery_image_tags
    from models.tag import Tag, get_child_tags

    tags = list(get_child_tags(object_type, object_id))
    own_tag = Tag.query.filter_by(object_type=object_type, object_id=object_id).first()
    if own_tag:
        tags.append(own_tag)
    if not tags:
        return 0

    tag_ids = [tag.id for tag in tags]
    query = (
        db.session.query(func.count(func.distinct(GalleryImage.id)))
        .select_from(GalleryImage)
        .join(gallery_image_tags, gallery_image_tags.c.gallery_image_id == GalleryImage.id)
        .filter(gallery_image_tags.c.tag_id.in_(tag_ids))
    )
    if not SecretService.can_view_secrets():
        query = query.filter(~GalleryImage.id.in_(SecretService.secret_gallery_image_ids_subquery()))
    return int(query.scalar() or 0)


def count_all_gallery_images() -> int:
    """Count all gallery images visible to the current user (region gallery)."""
    from models.gallery_image import GalleryImage

    query = db.session.query(func.count(GalleryImage.id))
    if not SecretService.can_view_secrets():
        query = query.filter(~GalleryImage.id.in_(SecretService.secret_gallery_image_ids_subquery()))
    return int(query.scalar() or 0)
