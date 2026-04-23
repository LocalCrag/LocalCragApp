import datetime

import pytz
from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from models.enums.searchable_item_type_enum import SearchableItemTypeEnum
from models.instance_settings import InstanceSettings
from models.recent_search import RecentSearch
from models.searchable import Searchable
from models.user import User
from util.generic_relationships import check_object_exists, get_object_secret
from util.search_result_serialization import serialize_search_result
from util.secret_spots_auth import get_show_secret
from webargs_schemas.recent_search_args import recent_search_create_args

MAX_RECENT_SEARCHES = 10


def _normalize_object_type(value: object) -> str:
    if not isinstance(value, str):
        raise BadRequest("objectType must be a string.")
    normalized = value.strip().lower()
    mapping = {
        "line": "Line",
        "area": "Area",
        "sector": "Sector",
        "crag": "Crag",
        "user": "User",
    }
    if normalized not in mapping:
        allowed = ", ".join(sorted(mapping.keys()))
        raise BadRequest(f"Invalid objectType '{value}'. Allowed values: {allowed}.")
    return mapping[normalized]


class Search(MethodView):
    def get(self, query):
        if not query:
            raise BadRequest("A search query is required.")

        # Optional filter: restrict search results to a single object type.
        # API expects values like: Crag, Sector, Area, Line, User (case-insensitive).
        object_type = request.args.get("objectType")
        type_filter = None
        if object_type:
            normalized = object_type.strip().upper()
            try:
                type_filter = SearchableItemTypeEnum[normalized]
            except KeyError as e:
                allowed = ", ".join([t.name.title() for t in SearchableItemTypeEnum])
                raise BadRequest(f"Invalid objectType '{object_type}'. Allowed values: {allowed}.") from e
        instance_settings = InstanceSettings.return_it()
        db_query = db.session.query(Searchable)
        if not get_show_secret():
            db_query = db_query.filter(Searchable.secret.is_(False))
        if type_filter is not None:
            db_query = db_query.filter(Searchable.type == type_filter)
        if instance_settings.skipped_hierarchical_layers > 0:
            db_query = db_query.filter(Searchable.type != SearchableItemTypeEnum.CRAG.value)
        if instance_settings.skipped_hierarchical_layers > 1:
            db_query = db_query.filter(Searchable.type != SearchableItemTypeEnum.SECTOR.value)
        searchables = (
            db_query.order_by(func.levenshtein(Searchable.name, query) / (1 + func.length(Searchable.name)))
            .limit(10)
            .all()
        )
        result = []
        for searchable in searchables:
            serialized = serialize_search_result(searchable.type.value.title(), searchable.id)
            if serialized:
                result.append(serialized)
        return jsonify(result), 200


class GetRecentSearches(MethodView):

    @jwt_required()
    def get(self):
        user = User.find_by_email(get_jwt_identity())
        recent_entries = (
            RecentSearch.query.filter_by(user_id=user.id)
            .order_by(RecentSearch.time_created.desc())
            .limit(MAX_RECENT_SEARCHES)
            .all()
        )
        result = []
        for entry in recent_entries:
            if not entry.object or (not get_show_secret() and get_object_secret(entry.object_type, entry.object_id)):
                continue
            serialized = serialize_search_result(entry.object_type, entry.object_id)
            if serialized:
                result.append(serialized)
        return jsonify(result), 200


class CreateRecentSearch(MethodView):

    @jwt_required()
    def post(self):
        user = User.find_by_email(get_jwt_identity())
        data = parser.parse(recent_search_create_args)

        object_type = _normalize_object_type(data["objectType"])
        object_id = data["objectId"]
        if not check_object_exists(object_type, object_id):
            raise BadRequest("Referenced object does not exist.")
        if object_type != "User" and (not get_show_secret()) and get_object_secret(object_type, object_id):
            raise BadRequest("Referenced object is not visible.")

        existing = RecentSearch.query.filter_by(
            user_id=user.id,
            object_type=object_type,
            object_id=object_id,
        ).first()
        if existing:
            existing.time_created = datetime.datetime.now(pytz.utc)
            db.session.add(existing)
        else:
            entry = RecentSearch()
            entry.user_id = user.id
            entry.object_type = object_type
            entry.object_id = object_id
            db.session.add(entry)
        db.session.commit()

        # Keep only the most recent MAX_RECENT_SEARCHES items.
        to_delete = (
            RecentSearch.query.filter_by(user_id=user.id)
            .order_by(RecentSearch.time_created.desc())
            .offset(MAX_RECENT_SEARCHES)
            .all()
        )
        for entry in to_delete:
            db.session.delete(entry)
        if to_delete:
            db.session.commit()
        return jsonify(None), 204
