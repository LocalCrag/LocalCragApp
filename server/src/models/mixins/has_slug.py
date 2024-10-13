import re

from sqlalchemy import event
from sqlalchemy.orm import declarative_mixin

from extensions import db


def str_to_slug(name: str) -> str:
    """
    Converts a string to a slug like string that can be used in URLs.
    """
    name = name.lower()
    name = re.sub("[ä]", "ae", name)
    name = re.sub("[ö]", "oe", name)
    name = re.sub("[ü]", "ue", name)
    name = re.sub("[ß]", "ss", name)
    name = re.sub("[^a-z0-9]", "-", name)
    return name.strip("-")


@declarative_mixin
class HasSlug:
    """
    Mixin class that adds a slug column to a model.
    """

    slug_blocklist = []
    slug_target_columns = "name"
    slug = db.Column(
        db.String,
        unique=True,
        nullable=False,
    )


@event.listens_for(db.session, "before_commit")
def update_slugs(session):
    """
    Generates a free slug for all dirty slug items.
    Source: https://digitalhedgehog.org/articles/how-to-manage-slugs-for-database-entities-with-flask-and-sqlalchemy
    """
    new_items = [item for item in session.new if isinstance(item, HasSlug)]
    dirty_items = [item for item in session.dirty if isinstance(item, HasSlug)]
    all_items = new_items + dirty_items
    if all_items:
        slugs_map = {}
        for item in all_items:
            table = item.__table__

            if table not in slugs_map:
                slugs_map[table] = set(c[0] for c in session.execute(db.select(table.c.slug)))

            for blocklisted_slug in item.slug_blocklist:
                slugs_map[table].add(blocklisted_slug)

            item_slug = item.slug or ""
            title_parts = []
            for slug_target_column in item.slug_target_columns.split(", "):
                title_parts.append(getattr(item, slug_target_column))
            title = " ".join(title_parts)
            slug = str_to_slug(title)
            if not item_slug.startswith(slug):
                i = 1

                while slug in slugs_map[table]:
                    slug = str_to_slug(title) + "-" + str(i)
                    i += 1
                item.slug = slug
                slugs_map[table].add(slug)
