from sqlalchemy import UUID

from extensions import db
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum


class Searchable(db.Model):
    __tablename__ = 'searchables'

    name = db.Column(db.String(120), nullable=False)
    type = db.Column(db.Enum(SearchableItemTypeEnum), nullable=False, primary_key=True)
    id = db.Column(UUID(), nullable=False, primary_key=True)

    @classmethod
    def search(cls, query, limit):
        query = cls.query.filter(Searchable.name.like('%' + query + '%'))
        return query.limit(limit).all()