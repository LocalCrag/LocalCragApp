from flask import jsonify
from flask.views import MethodView
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from sqlalchemy import func

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.search_schema import user_search_schema, line_search_schema, area_search_schema, \
    sector_search_schema, crag_search_schema
from models.area import Area
from models.crag import Crag
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.line import Line
from models.searchable import Searchable
from models.sector import Sector
from models.user import User


class Search(MethodView):
    def get(self, query):
        if not query:
            raise BadRequest('A search query is required.')
        db_query  = db.session.query(Searchable)
        has_jwt = bool(verify_jwt_in_request(optional=True))
        claims = get_jwt()
        if not has_jwt or (not claims['admin'] and not claims['moderator'] and not claims['member']):
            db_query = db_query.filter(Searchable.secret==False)
        searchables = db_query.order_by(func.levenshtein(Searchable.name, query)).limit(10).all()
        result = []
        for searchable in searchables:
            item = None
            if searchable.type == SearchableItemTypeEnum.CRAG:
                item = crag_search_schema.dump(Crag.find_by_id(searchable.id))
            if searchable.type == SearchableItemTypeEnum.SECTOR:
                item = sector_search_schema.dump(Sector.find_by_id(searchable.id))
            if searchable.type == SearchableItemTypeEnum.AREA:
                item = area_search_schema.dump(Area.find_by_id(searchable.id))
            if searchable.type == SearchableItemTypeEnum.LINE:
                item = line_search_schema.dump(Line.find_by_id(searchable.id))
            if searchable.type == SearchableItemTypeEnum.USER:
                item = user_search_schema.dump(User.find_by_id(searchable.id))
            result.append({
                'type': searchable.type.value,
                'item': item
            })
        return jsonify(result), 200
