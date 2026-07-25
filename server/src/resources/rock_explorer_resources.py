from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.rock_explorer_schema import (
    rock_explorer_cluster_schema,
    rock_explorer_clusters_schema,
    rock_explorer_feature_schema,
    rock_explorer_features_schema,
)
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum
from models.gallery_image import gallery_image_tags
from models.rock_explorer_cluster import RockExplorerCluster
from models.rock_explorer_feature import RockExplorerFeature
from models.tag import Tag
from models.user import User
from util.rock_explorer import apply_rock_explorer_metadata
from util.security_util import check_auth_claims
from webargs_schemas.rock_explorer_args import (
    rock_explorer_cluster_args,
    rock_explorer_feature_args,
)

ALLOWED_GEOMETRY_TYPES = {"Point", "Polygon"}


def _validate_geometry(geometry: dict) -> dict:
    if not isinstance(geometry, dict):
        raise BadRequest("geometry must be a GeoJSON geometry object.")
    geom_type = geometry.get("type")
    if geom_type not in ALLOWED_GEOMETRY_TYPES:
        raise BadRequest(f"geometry.type must be one of: {', '.join(sorted(ALLOWED_GEOMETRY_TYPES))}.")
    if "coordinates" not in geometry:
        raise BadRequest("geometry.coordinates is required.")
    return geometry


def _resolve_cluster(cluster_id):
    if cluster_id is None:
        return None
    return RockExplorerCluster.find_by_id(cluster_id)


def _feature_properties(feature: RockExplorerFeature, has_images: bool = False) -> dict:
    return {
        "id": str(feature.id),
        "title": feature.title,
        "description": feature.description,
        "potential": feature.potential.value if feature.potential else None,
        "rockQuality": feature.rock_quality.value if feature.rock_quality else None,
        "rockType": feature.rock_type.value if feature.rock_type else None,
        "gradeLineType": feature.grade_line_type.value if feature.grade_line_type else None,
        "gradeScale": feature.grade_scale,
        "gradeValueMin": feature.grade_value_min,
        "gradeValueMax": feature.grade_value_max,
        "accessIssues": feature.access_issues or [],
        "hasImages": has_images,
        "clusterId": str(feature.cluster_id) if feature.cluster_id else None,
        "cragId": str(feature.crag_id) if feature.crag_id else None,
        "sectorId": str(feature.sector_id) if feature.sector_id else None,
        "areaId": str(feature.area_id) if feature.area_id else None,
        "lineId": str(feature.line_id) if feature.line_id else None,
    }


def _feature_ids_with_images(features: list[RockExplorerFeature]) -> set:
    """One aggregate query for the whole collection — never one per feature."""
    feature_ids = [feature.id for feature in features]
    if not feature_ids:
        return set()
    rows = (
        db.session.query(Tag.object_id)
        .join(gallery_image_tags, gallery_image_tags.c.tag_id == Tag.id)
        .filter(Tag.object_type == "RockExplorerFeature", Tag.object_id.in_(feature_ids))
        .group_by(Tag.object_id)
        .having(func.count(gallery_image_tags.c.gallery_image_id) > 0)
        .all()
    )
    return {row[0] for row in rows}


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
    cluster_id = request.args.get("clusterId")
    if cluster_id == "null":
        query = query.filter(RockExplorerFeature.cluster_id.is_(None))
    elif cluster_id:
        query = query.filter(RockExplorerFeature.cluster_id == cluster_id)
    return query


class GetRockExplorerFeatures(MethodView):
    @jwt_required()
    @check_auth_claims(member=True)
    def get(self):
        query = _apply_feature_filters(RockExplorerFeature.query)
        features = query.order_by(RockExplorerFeature.time_created.desc()).all()
        return jsonify(rock_explorer_features_schema.dump(features)), 200


class GetRockExplorerFeaturesGeoJSON(MethodView):
    @jwt_required()
    @check_auth_claims(member=True)
    def get(self):
        query = _apply_feature_filters(RockExplorerFeature.query)
        features = query.order_by(RockExplorerFeature.time_created.desc()).all()
        ids_with_images = _feature_ids_with_images(features)
        collection = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "id": str(feature.id),
                    "geometry": feature.geometry,
                    "properties": _feature_properties(feature, has_images=feature.id in ids_with_images),
                }
                for feature in features
            ],
        }
        return jsonify(collection), 200


class GetRockExplorerFeature(MethodView):
    @jwt_required()
    @check_auth_claims(member=True)
    def get(self, feature_id):
        feature = RockExplorerFeature.find_by_id(feature_id)
        return rock_explorer_feature_schema.dump(feature), 200


class CreateRockExplorerFeature(MethodView):
    @jwt_required()
    @check_auth_claims(member=True)
    def post(self):
        data = parser.parse(rock_explorer_feature_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        feature = RockExplorerFeature()
        feature.geometry = _validate_geometry(data["geometry"])
        feature.created_by_id = created_by.id
        apply_rock_explorer_metadata(feature, data)
        if "clusterId" in data:
            cluster = _resolve_cluster(data["clusterId"])
            feature.cluster_id = cluster.id if cluster else None

        db.session.add(feature)
        db.session.commit()
        return rock_explorer_feature_schema.dump(feature), 201


class UpdateRockExplorerFeature(MethodView):
    @jwt_required()
    @check_auth_claims(member=True)
    def put(self, feature_id):
        data = parser.parse(rock_explorer_feature_args, request)
        feature = RockExplorerFeature.find_by_id(feature_id)

        feature.geometry = _validate_geometry(data["geometry"])
        apply_rock_explorer_metadata(feature, data)
        if "clusterId" in data:
            cluster = _resolve_cluster(data["clusterId"])
            feature.cluster_id = cluster.id if cluster else None

        db.session.add(feature)
        db.session.commit()
        return rock_explorer_feature_schema.dump(feature), 200


class DeleteRockExplorerFeature(MethodView):
    @jwt_required()
    @check_auth_claims(member=True)
    def delete(self, feature_id):
        feature = RockExplorerFeature.find_by_id(feature_id)
        db.session.delete(feature)
        db.session.commit()
        return jsonify(None), 204


class GetRockExplorerClusters(MethodView):
    @jwt_required()
    @check_auth_claims(member=True)
    def get(self):
        clusters = RockExplorerCluster.return_all(order_by=lambda: RockExplorerCluster.time_created.desc())
        return jsonify(rock_explorer_clusters_schema.dump(clusters)), 200


class GetRockExplorerCluster(MethodView):
    @jwt_required()
    @check_auth_claims(member=True)
    def get(self, cluster_id):
        cluster = RockExplorerCluster.find_by_id(cluster_id)
        return rock_explorer_cluster_schema.dump(cluster), 200


class CreateRockExplorerCluster(MethodView):
    @jwt_required()
    @check_auth_claims(member=True)
    def post(self):
        data = parser.parse(rock_explorer_cluster_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        cluster = RockExplorerCluster()
        cluster.created_by_id = created_by.id
        apply_rock_explorer_metadata(cluster, data)

        db.session.add(cluster)
        db.session.commit()
        return rock_explorer_cluster_schema.dump(cluster), 201


class UpdateRockExplorerCluster(MethodView):
    @jwt_required()
    @check_auth_claims(member=True)
    def put(self, cluster_id):
        data = parser.parse(rock_explorer_cluster_args, request)
        cluster = RockExplorerCluster.find_by_id(cluster_id)
        apply_rock_explorer_metadata(cluster, data)
        db.session.add(cluster)
        db.session.commit()
        return rock_explorer_cluster_schema.dump(cluster), 200


class DeleteRockExplorerCluster(MethodView):
    @jwt_required()
    @check_auth_claims(member=True)
    def delete(self, cluster_id):
        cluster = RockExplorerCluster.find_by_id(cluster_id)
        db.session.delete(cluster)
        db.session.commit()
        return jsonify(None), 204
