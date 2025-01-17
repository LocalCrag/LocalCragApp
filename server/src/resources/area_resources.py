from typing import List

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.area_schema import area_schema, areas_schema
from models.area import Area
from models.enums.history_item_type_enum import HistoryItemTypeEnum
from models.history_item import HistoryItem
from models.line import Line
from models.sector import Sector
from models.user import User
from resources.map_resources import create_or_update_markers
from util.bucket_placeholders import add_bucket_placeholders
from util.propagating_boolean_attrs import (
    set_area_parents_false,
    update_area_propagating_boolean_attr,
)
from util.secret_spots_auth import get_show_secret
from util.security_util import check_auth_claims, check_secret_spot_permission
from util.validators import validate_order_payload
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
        new_area.closed = area_data["closed"]
        new_area.closed_reason = area_data["closedReason"]

        if not new_area.secret:
            set_area_parents_false(new_area, 'secret')
        if not new_area.closed:
            set_area_parents_false(new_area, 'closed')

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

        area.name = area_data["name"].strip()
        area.description = add_bucket_placeholders(area_data["description"])
        area.short_description = area_data["shortDescription"]
        area.portrait_image_id = area_data["portraitImage"]
        update_area_propagating_boolean_attr(area, area_data["secret"], "secret")
        update_area_propagating_boolean_attr(
            area, area_data["closed"], "closed", set_additionally={"closed_reason": area_data["closedReason"]}
        )
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
        query = db.session.query(Line.grade_name, Line.grade_scale).filter(Line.area_id == area_id)
        if not get_show_secret():
            query = query.filter(Line.secret.is_(False))
        result = query.all()
        return jsonify([{"gradeName": r[0], "gradeScale": r[1]} for r in result]), 200
