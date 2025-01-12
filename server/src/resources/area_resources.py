from collections import Counter, defaultdict
from typing import List

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from marshmallow_schemas.area_schema import area_schema, areas_schema
from models.area import Area
from models.enums.history_item_type_enum import HistoryItemTypeEnum
from models.enums.line_type_enum import LineTypeEnum
from models.history_item import HistoryItem
from models.line import Line
from models.sector import Sector
from models.user import User
from resources.map_resources import create_or_update_markers
from util.bucket_placeholders import add_bucket_placeholders
from util.secret_spots import set_area_parents_unsecret, update_area_secret_property
from util.secret_spots_auth import get_show_secret
from util.security_util import check_auth_claims, check_secret_spot_permission
from util.validators import validate_default_scales, validate_order_payload
from webargs_schemas.area_args import area_args


class GetAreas(MethodView):

    def get(self, sector_slug):
        """
        Returns all areas of a sector.
        """
        sector_id = Sector.get_id_by_slug(sector_slug)
        areas: List[Area] = Area.return_all(
            filter=lambda: Area.sector_id == sector_id, order_by=lambda: Area.order_index.asc()
        )
        return jsonify(areas_schema.dump(areas)), 200


class GetArea(MethodView):
    def get(self, area_slug):
        """
        Returns a detailed area.
        @param area_slug: Slug of the area to return.
        """
        area: Area = Area.find_by_slug(area_slug)
        check_secret_spot_permission(area)
        return area_schema.dump(area), 200


class CreateArea(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def post(self, sector_slug):
        """
        Creates an area.
        """
        sector_id = Sector.get_id_by_slug(sector_slug)
        area_data = parser.parse(area_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        valid, error = validate_default_scales(area_data)
        if not valid:
            raise NotFound(error)

        new_area: Area = Area()
        new_area.name = area_data["name"].strip()
        new_area.description = add_bucket_placeholders(area_data["description"])
        new_area.short_description = area_data["shortDescription"]
        new_area.portrait_image_id = area_data["portraitImage"]
        new_area.sector_id = sector_id
        new_area.created_by_id = created_by.id
        new_area.order_index = Area.find_max_order_index(sector_id) + 1
        new_area.secret = area_data["secret"]
        new_area.map_markers = create_or_update_markers(area_data["mapMarkers"], new_area)
        new_area.default_boulder_scale = area_data["defaultBoulderScale"]
        new_area.default_sport_scale = area_data["defaultSportScale"]
        new_area.default_trad_scale = area_data["defaultTradScale"]

        if not new_area.secret:
            set_area_parents_unsecret(new_area)

        db.session.add(new_area)
        db.session.commit()

        HistoryItem.create_history_item(HistoryItemTypeEnum.CREATED, new_area, created_by)

        return area_schema.dump(new_area), 201


class UpdateArea(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, area_slug):
        """
        Edit an area.
        @param area_slug: Slug of the area to update.
        """
        area_data = parser.parse(area_args, request)
        area: Area = Area.find_by_slug(area_slug)

        valid, error = validate_default_scales(area_data)
        if not valid:
            raise NotFound(error)

        area.name = area_data["name"].strip()
        area.description = add_bucket_placeholders(area_data["description"])
        area.short_description = area_data["shortDescription"]
        area.portrait_image_id = area_data["portraitImage"]
        update_area_secret_property(area, area_data["secret"])
        area.default_boulder_scale = area_data["defaultBoulderScale"]
        area.default_sport_scale = area_data["defaultSportScale"]
        area.default_trad_scale = area_data["defaultTradScale"]

        area.map_markers = create_or_update_markers(area_data["mapMarkers"], area)
        db.session.add(area)
        db.session.commit()

        return area_schema.dump(area), 200


class DeleteArea(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def delete(self, area_slug):
        """
        Delete an area.
        @param area_slug: Slug of the area to delete.
        """
        area: Area = Area.find_by_slug(area_slug)

        db.session.delete(area)
        query = text(
            "UPDATE areas SET order_index=order_index - 1 WHERE order_index > :order_index AND sector_id = :sector_id"
        )
        db.session.execute(query, {"order_index": area.order_index, "sector_id": area.sector_id})
        db.session.commit()

        return jsonify(None), 204


class UpdateAreaOrder(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, sector_slug):
        """
        Changes the order index of areas.
        """
        new_order = request.json
        sector_id = Sector.get_id_by_slug(sector_slug)
        areas: List[Area] = Area.return_all(filter=lambda: Area.sector_id == sector_id)

        if not validate_order_payload(new_order, areas):
            raise BadRequest("New order doesn't match the requirements of the data to order.")

        for area in areas:
            area.order_index = new_order[str(area.id)]
            db.session.add(area)

        db.session.commit()

        return jsonify(None), 200


class GetAreaGrades(MethodView):

    def get(self, area_slug):
        """
        Returns the grades of all lines of an area.
        """
        area_id = Area.get_id_by_slug(area_slug)
        query = db.session.query(Line.type, Line.grade_scale, Line.grade_value).filter(
            Line.area_id == area_id, Line.archived.is_(False)
        )
        if not get_show_secret():
            query = query.filter(Line.secret.is_(False))
        result = query.all()

        response_data = {
            LineTypeEnum.BOULDER.value: defaultdict(Counter),
            LineTypeEnum.SPORT.value: defaultdict(Counter),
            LineTypeEnum.TRAD.value: defaultdict(Counter),
        }
        for lineType, gradeScale, gradeValue in result:
            response_data[lineType.value][gradeScale].update({gradeValue: 1})

        return jsonify(response_data), 200
