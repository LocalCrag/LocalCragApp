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
from util.generic_relationships import check_object_exists
from util.search_result_serialization import (
    searchable_type_to_object_type,
    serialize_search_result,
)
from util.secret_service import SecretService
from util.security_util import current_user_is_member
from webargs_schemas.recent_search_args import recent_search_create_args

MAX_RECENT_SEARCHES = 10

_OBJECT_TYPE_ALIASES = {
    "line": "Line",
    "area": "Area",
    "sector": "Sector",
    "crag": "Crag",
    "user": "User",
    "rockexplorerfeature": "RockExplorerFeature",
    "rock_explorer_feature": "RockExplorerFeature",
}

_SEARCH_TYPE_FILTER_ALIASES = {
    "line": SearchableItemTypeEnum.LINE,
    "area": SearchableItemTypeEnum.AREA,
    "sector": SearchableItemTypeEnum.SECTOR,
    "crag": SearchableItemTypeEnum.CRAG,
    "user": SearchableItemTypeEnum.USER,
    "rockexplorerfeature": SearchableItemTypeEnum.ROCK_EXPLORER_FEATURE,
    "rock_explorer_feature": SearchableItemTypeEnum.ROCK_EXPLORER_FEATURE,
}


def _normalize_object_type(value: object) -> str:
    if not isinstance(value, str):
        raise BadRequest("objectType must be a string.")
    key = value.strip().lower().replace("-", "_").replace(" ", "_")
    compact = key.replace("_", "")
    if key in _OBJECT_TYPE_ALIASES:
        return _OBJECT_TYPE_ALIASES[key]
    if compact in _OBJECT_TYPE_ALIASES:
        return _OBJECT_TYPE_ALIASES[compact]
    allowed = ", ".join(sorted(set(_OBJECT_TYPE_ALIASES.values())))
    raise BadRequest(f"Invalid objectType '{value}'. Allowed values: {allowed}.")


def _parse_type_filter(object_type: str) -> SearchableItemTypeEnum:
    key = object_type.strip().lower().replace("-", "_").replace(" ", "_")
    compact = key.replace("_", "")
    if key in _SEARCH_TYPE_FILTER_ALIASES:
        return _SEARCH_TYPE_FILTER_ALIASES[key]
    if compact in _SEARCH_TYPE_FILTER_ALIASES:
        return _SEARCH_TYPE_FILTER_ALIASES[compact]
    try:
        return SearchableItemTypeEnum[object_type.strip().upper()]
    except KeyError as e:
        allowed = ", ".join([t.name for t in SearchableItemTypeEnum])
        raise BadRequest(f"Invalid objectType '{object_type}'. Allowed values: {allowed}.") from e


class Search(MethodView):
    def get(self, query):
        if not query:
            raise BadRequest("A search query is required.")

        # Optional filter: restrict search results to a single object type.
        # API expects values like: Crag, Sector, Area, Line, User, RockExplorerFeature.
        object_type = request.args.get("objectType")
        type_filter = None
        if object_type:
            type_filter = _parse_type_filter(object_type)
        instance_settings = InstanceSettings.return_it()
        db_query = db.session.query(Searchable)
        db_query = SecretService.apply_searchable_filter(db_query)
        if type_filter is not None:
            db_query = db_query.filter(Searchable.type == type_filter)
        if instance_settings.skipped_hierarchical_layers > 0:
            db_query = db_query.filter(Searchable.type != SearchableItemTypeEnum.CRAG.value)
        if instance_settings.skipped_hierarchical_layers > 1:
            db_query = db_query.filter(Searchable.type != SearchableItemTypeEnum.SECTOR.value)
        if not current_user_is_member():
            db_query = db_query.filter(Searchable.type != SearchableItemTypeEnum.ROCK_EXPLORER_FEATURE.value)
        searchables = (
            db_query.order_by(func.levenshtein(Searchable.name, query) / (1 + func.length(Searchable.name)))
            .limit(10)
            .all()
        )
        result = []
        for searchable in searchables:
            object_type_name = searchable_type_to_object_type(searchable.type.value)
            if not object_type_name:
                continue
            serialized = serialize_search_result(object_type_name, searchable.id)
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
            if entry.object_type == "RockExplorerFeature" and not current_user_is_member():
                continue
            if not entry.object or (not SecretService.can_view_secrets() and SecretService.is_secret(entry.object_id)):
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
        if object_type == "RockExplorerFeature" and not current_user_is_member():
            raise BadRequest("Referenced object is not visible.")
        if object_type != "User" and (not SecretService.can_view_secrets()) and SecretService.is_secret(object_id):
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
