import re

from sqlalchemy import event
from sqlalchemy.orm import declarative_mixin

from extensions import db
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.searchable import Searchable


@declarative_mixin
class IsSearchable:
    name_target_columns = ['name']
    searchable_type: SearchableItemTypeEnum = SearchableItemTypeEnum.LINE


@event.listens_for(db.session, "before_commit")
def update_searchable(session):
    new_items = [item for item in session.new if isinstance(item, IsSearchable)]
    for item in new_items:
        searchable = Searchable()
        searchable.id = getattr(item, 'id') # todo id doesnt yet exist
        searchable.type = item.searchable_type
        searchable.name = ''.join(
            [getattr(item, name_target_column) for name_target_column in item.name_target_columns])
        db.session.add(searchable)

    dirty_items = [item for item in session.dirty if isinstance(item, IsSearchable)]
    for item in dirty_items:
        searchable = (db.session.query(Searchable)
                      .filter(Searchable.id == getattr(item, 'id'))
                      .filter(Searchable.type == item.searchable_type)
                      .first()) # todo needs setup script
        searchable.name = ''.join(
            [getattr(item, name_target_column) for name_target_column in item.name_target_columns])
        db.session.add(searchable)

