from sqlalchemy import select

from extensions import db
from models.secret_topo_entity import SecretTopoEntity
from util.secret_spots_auth import get_show_secret


class SecretService:
    """Central API for secret-spot visibility checks and query filters.

    Membership is stored in ``secret_topo_entities``. Topo models expose ``secret`` as a
    hybrid property backed by that registry.
    """

    @staticmethod
    def can_view_secrets() -> bool:
        """Return whether the current request may see secret topo entities."""
        return get_show_secret()

    @staticmethod
    def is_secret(entity_id) -> bool:
        """Return whether ``entity_id`` is registered as a secret topo entity."""
        return db.session.get(SecretTopoEntity, entity_id) is not None

    @staticmethod
    def attach_secret_flags(entities) -> None:
        """Bulk-load secret registry membership for list serialization."""
        from models.mixins.is_secret import _SECRET_CACHE_ATTR

        ids = [entity.id for entity in entities if entity.id is not None]
        if not ids:
            return

        secret_ids = {
            row[0]
            for row in db.session.query(SecretTopoEntity.entity_id).filter(SecretTopoEntity.entity_id.in_(ids)).all()
        }
        for entity in entities:
            if entity.id is not None:
                object.__setattr__(entity, _SECRET_CACHE_ATTR, entity.id in secret_ids)

    @staticmethod
    def apply_topo_entity_filter(query, model):
        """Exclude secret rows from ``query`` when the caller lacks secret access.

        Expects ``model`` to use :class:`~models.mixins.is_secret.IsSecret`.
        """
        if SecretService.can_view_secrets():
            return query
        return query.filter(model.secret.is_(False))

    @staticmethod
    def apply_line_filter(query):
        """Like :meth:`apply_topo_entity_filter` for line queries."""
        from models.line import Line

        return SecretService.apply_topo_entity_filter(query, Line)

    @staticmethod
    def secret_gallery_image_ids_subquery():
        """Return gallery image IDs that are tagged with at least one secret topo entity."""
        from models.gallery_image import gallery_image_tags
        from models.tag import Tag

        return (
            select(gallery_image_tags.c.gallery_image_id)
            .join(Tag, gallery_image_tags.c.tag_id == Tag.id)
            .join(SecretTopoEntity, Tag.object_id == SecretTopoEntity.entity_id)
        )

    @staticmethod
    def apply_searchable_filter(query):
        """Exclude searchables backed by secret topo entities when access is denied.

        User searchables are unaffected because they are never present in the registry.
        """
        from models.searchable import Searchable

        if SecretService.can_view_secrets():
            return query
        return query.outerjoin(SecretTopoEntity, Searchable.id == SecretTopoEntity.entity_id).filter(
            SecretTopoEntity.entity_id.is_(None)
        )
