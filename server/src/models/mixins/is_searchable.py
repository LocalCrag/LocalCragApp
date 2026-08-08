from sqlalchemy import event
from sqlalchemy.orm import declarative_mixin

from extensions import db
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.searchable import Searchable


@declarative_mixin
class IsSearchable:
    search_name_target_columns = ["name"]
    searchable_type: SearchableItemTypeEnum = SearchableItemTypeEnum.LINE

    def get_search_name(self):
        parts = []
        for name_target_column in self.search_name_target_columns:
            value = getattr(self, name_target_column)
            if value is None:
                return None
            parts.append(value)
        name = "".join(parts)
        return name or None

    def should_be_searchable(self) -> bool:
        return self.get_search_name() is not None

    def _find_searchable(self):
        return (
            db.session.query(Searchable)
            .filter(Searchable.id == getattr(self, "id"))
            .filter(Searchable.type == self.searchable_type)
            .first()
        )


@event.listens_for(db.session, "before_flush")
def update_searchables(session, flush_context, instances):
    dirty_items = [item for item in session.dirty if isinstance(item, IsSearchable)]
    for item in dirty_items:
        searchable = item._find_searchable()
        if item.should_be_searchable():
            if searchable is None:
                searchable = Searchable()
                searchable.id = getattr(item, "id")
                searchable.type = item.searchable_type
            searchable.name = item.get_search_name()
            db.session.add(searchable)
        elif searchable is not None:
            db.session.delete(searchable)

    deleted_items = [item for item in session.deleted if isinstance(item, IsSearchable)]
    for item in deleted_items:
        searchable = item._find_searchable()
        if searchable is not None:
            db.session.delete(searchable)


@event.listens_for(db.session, "after_flush")
def create_searchables(session, flush_context):
    new_items = [item for item in session.new if isinstance(item, IsSearchable)]
    for item in new_items:
        if not item.should_be_searchable():
            continue
        searchable = Searchable()
        searchable.id = getattr(item, "id")
        searchable.type = item.searchable_type
        searchable.name = item.get_search_name()
        db.session.add(searchable)
