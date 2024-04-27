from flask import jsonify
from flask.views import MethodView

from marshmallow_schemas.area_schema import area_schema
from marshmallow_schemas.crag_schema import crag_schema
from marshmallow_schemas.line_schema import line_schema
from marshmallow_schemas.sector_schema import sector_schema
from marshmallow_schemas.user_schema import user_schema
from models.area import Area
from models.crag import Crag
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.line import Line
from models.searchable import Searchable
from models.sector import Sector
from models.user import User


class Search(MethodView):
    def get(self, query):
        searchables = Searchable.search(query, 5)
        result = []
        for searchable in searchables:
            item = None
            if searchable.type == SearchableItemTypeEnum.CRAG:
                item = crag_schema.dump(Crag.find_by_id(searchable.id))
            if searchable.type == SearchableItemTypeEnum.SECTOR:
                item = sector_schema.dump(Sector.find_by_id(searchable.id))
            if searchable.type == SearchableItemTypeEnum.AREA:
                item = area_schema.dump(Area.find_by_id(searchable.id))
            if searchable.type == SearchableItemTypeEnum.LINE:
                item = line_schema.dump(Line.find_by_id(searchable.id))
            if searchable.type == SearchableItemTypeEnum.USER:
                item = user_schema.dump(User.find_by_id(searchable.id))
            result.append({
                type: searchable.type,
                item: item
            })
        return jsonify(result), 200