from collections import defaultdict
from typing import Iterable, List

from sqlalchemy import text

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

    Notes:
    This utility may be executed at various points in the migration chain. Using
    the ORM to load entities can break if model definitions contain columns that
    aren't present in the DB yet. To stay compatible, we only select the minimal
    columns needed (id, slug) via SQL and then load entities by primary key.
    """
    affected = 0

    with app.app_context():

        changes: dict[str, List[tuple[str, str]]] = defaultdict(list)

        for model_cls in _iter_has_slug_models():
            blocklist = list(getattr(model_cls, "slug_blocklist", []))
            if not blocklist:
                continue

            table = getattr(model_cls, "__tablename__", model_cls.__name__.lower())

            # Select only the columns we need, to avoid referencing columns that
            # might not exist yet at this migration state.
            stmt = text(f"SELECT id, slug FROM {table} WHERE slug = ANY(:blocklist)")
            rows = db.session.execute(stmt, {"blocklist": blocklist}).fetchall()
            if not rows:
                continue

            for row in rows:
                item_id, old_slug = row
                item = db.session.get(model_cls, item_id)
                if item is None:
                    continue

                item.slug = ""  # trigger update_slugs
                changes[table].append((str(item_id), old_slug))
                affected += 1

        if affected:
            db.session.commit()
