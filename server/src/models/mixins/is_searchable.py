from sqlalchemy import event
from sqlalchemy.orm import declarative_mixin

from extensions import db
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.searchable import Searchable


@declarative_mixin
class IsSearchable:
    search_name_target_columns = ["name"]
    searchable_type: SearchableItemTypeEnum = SearchableItemTypeEnum.LINE


@event.listens_for(db.session, "before_flush")
def update_searchables(session, flush_context, instances):
    dirty_items = [item for item in session.dirty if isinstance(item, IsSearchable)]
    for item in dirty_items:
        searchable = (
            db.session.query(Searchable)
            .filter(Searchable.id == getattr(item, "id"))
            .filter(Searchable.type == item.searchable_type)
            .first()
        )
        searchable.name = "".join(
            [getattr(item, name_target_column) for name_target_column in item.search_name_target_columns]
        )
        if hasattr(item, "secret"):
            searchable.secret = item.secret
        db.session.add(searchable)

    deleted_items = [item for item in session.deleted if isinstance(item, IsSearchable)]
    for item in deleted_items:
        searchable = (
            db.session.query(Searchable)
            .filter(Searchable.id == getattr(item, "id"))
            .filter(Searchable.type == item.searchable_type)
            .first()
        )
        db.session.delete(searchable)


@event.listens_for(db.session, "after_flush")
def create_searchables(session, flush_context):
    new_items = [item for item in session.new if isinstance(item, IsSearchable)]
    for item in new_items:
        searchable = Searchable()
        searchable.id = getattr(item, "id")
        searchable.type = item.searchable_type
        searchable.name = "".join(
            [getattr(item, name_target_column) for name_target_column in item.search_name_target_columns]
        )
        if hasattr(item, "secret"):
            searchable.secret = item.secret
        db.session.add(searchable)
