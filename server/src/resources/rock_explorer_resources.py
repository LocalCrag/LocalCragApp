import uuid

from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy import func, or_
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.rock_explorer_schema import (
    dump_rock_explorer_geojson_collection,
    rock_explorer_feature_schema,
)
from marshmallow_schemas.user_schema import user_min_with_avatar_schema
from models.enums.rock_explorer_feature_status_enum import RockExplorerFeatureStatusEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum
from models.rock_explorer_feature import RockExplorerFeature
from models.user import User
from util.auth_session import (
    get_session_identity,
    session_required,
)
from util.rock_explorer import (
    apply_rock_explorer_metadata,
    assert_can_view_feature,
    assert_draft_mutable,
    clone_rock_explorer_feature,
)
from util.tag_object_prefetch import prefetch_tag_objects
from webargs_schemas.rock_explorer_args import (
    cross_validate_rock_explorer_feature_args,
    rock_explorer_clone_args,
    rock_explorer_feature_args,
)


def _apply_feature_filters(query):
    potential = request.args.get("potential")
    if potential:
        try:
            query = query.filter(RockExplorerFeature.potential == RockExplorerPotentialEnum(potential))
        except ValueError as exc:
            raise BadRequest(f"Invalid potential filter: {potential}") from exc
    rock_quality = request.args.get("rockQuality")
    if rock_quality:
        try:
            query = query.filter(RockExplorerFeature.rock_quality == RockExplorerRockQualityEnum(rock_quality))
        except ValueError as exc:
            raise BadRequest(f"Invalid rockQuality filter: {rock_quality}") from exc
    rock_type = request.args.get("rockType")
    if rock_type:
        try:
            query = query.filter(RockExplorerFeature.rock_type == RockExplorerRockTypeEnum(rock_type))
        except ValueError as exc:
            raise BadRequest(f"Invalid rockType filter: {rock_type}") from exc
    created_by_id = request.args.get("createdById")
    if created_by_id:
        try:
            uuid.UUID(created_by_id)
        except ValueError as exc:
            raise BadRequest(f"Invalid createdById filter: {created_by_id}") from exc
        query = query.filter(RockExplorerFeature.created_by_id == created_by_id)
    return query


def _published_feature_creator_ids_subquery():
    return (
        db.session.query(RockExplorerFeature.created_by_id)
        .filter(
            RockExplorerFeature.status == RockExplorerFeatureStatusEnum.PUBLISHED,
            RockExplorerFeature.created_by_id.isnot(None),
        )
        .distinct()
        .scalar_subquery()
    )


def _dump_feature(feature: RockExplorerFeature):
    prefetch_tag_objects(list(feature.topo_links or []))
    return rock_explorer_feature_schema.dump(feature)


def _current_user():
    return User.find_by_email(get_session_identity())


class SearchRockExplorerFeatureCreators(MethodView):
    @session_required(member=True)
    def get(self):
        query_str = (request.args.get("q") or "").strip()
        if not query_str:
            return jsonify([]), 200

        pattern = f"%{query_str}%"
        users = (
            User.query.filter(User.id.in_(_published_feature_creator_ids_subquery()))
            .filter(
                or_(
                    User.firstname.ilike(pattern),
                    User.lastname.ilike(pattern),
                    func.concat(User.firstname, " ", User.lastname).ilike(pattern),
                )
            )
            .order_by(User.firstname, User.lastname)
            .limit(10)
            .all()
        )
        return jsonify(user_min_with_avatar_schema.dump(users, many=True)), 200


class GetRockExplorerFeaturesGeoJSON(MethodView):
    @session_required(member=True)
    def get(self):
        query = _apply_feature_filters(RockExplorerFeature.query)
        query = query.filter(RockExplorerFeature.status == RockExplorerFeatureStatusEnum.PUBLISHED)
        features = query.order_by(RockExplorerFeature.time_created.desc()).all()
        return jsonify(dump_rock_explorer_geojson_collection(features)), 200


class GetRockExplorerFeature(MethodView):
    @session_required(member=True)
    def get(self, feature_id):
        feature = RockExplorerFeature.find_by_id(feature_id)
        assert_can_view_feature(feature, _current_user())
        return _dump_feature(feature), 200


class RockExplorerFeatures(MethodView):
    """Collection: GET owner drafts (?status=draft), POST create."""

    @session_required(member=True)
    def get(self):
        status = request.args.get("status")
        if status != "draft":
            raise BadRequest("GET /features requires status=draft.")
        user = _current_user()
        features = (
            RockExplorerFeature.query.filter(
                RockExplorerFeature.status == RockExplorerFeatureStatusEnum.DRAFT,
                RockExplorerFeature.created_by_id == user.id,
            )
            .order_by(
                RockExplorerFeature.recording_updated_at.desc().nullslast(),
                RockExplorerFeature.time_updated.desc(),
            )
            .all()
        )
        return [_dump_feature(f) for f in features], 200

    @session_required(member=True)
    def post(self):
        data = parser.parse(
            rock_explorer_feature_args,
            request,
            validate=cross_validate_rock_explorer_feature_args,
        )
        created_by = _current_user()

        feature = RockExplorerFeature()
        feature.geometry = data["geometry"]
        feature.created_by_id = created_by.id
        apply_rock_explorer_metadata(feature, data)

        db.session.add(feature)
        db.session.commit()
        return _dump_feature(feature), 201


class UpdateRockExplorerFeature(MethodView):
    @session_required(member=True)
    def put(self, feature_id):
        data = parser.parse(
            rock_explorer_feature_args,
            request,
            validate=cross_validate_rock_explorer_feature_args,
        )
        feature = RockExplorerFeature.find_by_id(feature_id)
        user = _current_user()
        device_id = data.get("recordingDeviceId")
        assert_draft_mutable(feature, user, device_id)

        feature.geometry = data["geometry"]
        apply_rock_explorer_metadata(feature, data)

        db.session.add(feature)
        db.session.commit()
        return _dump_feature(feature), 200


class DeleteRockExplorerFeature(MethodView):
    @session_required(member=True)
    def delete(self, feature_id):
        feature = RockExplorerFeature.find_by_id(feature_id)
        user = _current_user()
        if feature.status == RockExplorerFeatureStatusEnum.DRAFT:
            device_id = request.args.get("recordingDeviceId")
            if device_id is None and request.is_json and request.json:
                device_id = request.json.get("recordingDeviceId")
            assert_draft_mutable(feature, user, device_id)
        db.session.delete(feature)
        db.session.commit()
        return jsonify(None), 204


class CloneRockExplorerFeature(MethodView):
    @session_required(member=True)
    def post(self, feature_id):
        data = parser.parse(rock_explorer_clone_args, request)
        feature = RockExplorerFeature.find_by_id(feature_id)
        user = _current_user()
        clone = clone_rock_explorer_feature(feature, user, data["recordingDeviceId"])
        db.session.commit()
        return _dump_feature(clone), 201
