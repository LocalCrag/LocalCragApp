from collections import defaultdict
from typing import Iterable, List

from app import app
from extensions import db
from models.mixins.has_slug import HasSlug


def _iter_has_slug_models() -> Iterable[type]:
    """
    Yield all mapped model classes that include the HasSlug mixin.
    """
    mappers = getattr(db.Model, "registry").mappers
    for mapper in mappers:
        cls = mapper.class_
        if isinstance(cls, type) and issubclass(cls, HasSlug):
            yield cls
    return


def regenerate_blocklisted_slugs():
    """
    Find all records whose slug is currently in their model's slug_blocklist and
    force regeneration via the existing before_flush hook (update_slugs).
    """
    affected = 0

    with app.app_context():

        changes: dict[str, List[tuple[str, str]]] = defaultdict(list)

        for model_cls in _iter_has_slug_models():
            # Query items that currently have a blocklisted slug
            blocklist = list(getattr(model_cls, "slug_blocklist", []))
            if not blocklist:
                continue

            # Use IN query to find offenders
            offenders = model_cls.query.filter(model_cls.slug.in_(blocklist)).all()
            if not offenders:
                continue

            for item in offenders:
                # Force slug regeneration by marking the item as dirty with a slug
                # that definitely doesn't start with the computed title slug.
                # Empty string is safe here because the before_flush hook will compute
                # and assign a valid unique slug before flush hits the DB.
                old_slug = item.slug
                item.slug = ""  # trigger update_slugs
                table = getattr(model_cls, "__tablename__", model_cls.__name__.lower())
                changes[table].append((str(getattr(item, "id", "?")), old_slug))
                affected += 1

        if affected:
            db.session.commit()
