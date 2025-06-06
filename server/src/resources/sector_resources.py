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
from marshmallow_schemas.sector_schema import sector_schema, sectors_schema
from models.area import Area
from models.crag import Crag
from models.enums.history_item_type_enum import HistoryItemTypeEnum
from models.enums.line_type_enum import LineTypeEnum
from models.history_item import HistoryItem
from models.instance_settings import InstanceSettings
from models.line import Line
from models.sector import Sector
from models.user import User
from resources.map_resources import create_or_update_markers
from util.bucket_placeholders import add_bucket_placeholders
from util.propagating_boolean_attrs import (
    set_sector_parents_false,
    update_sector_propagating_boolean_attr,
)
from util.secret_spots_auth import get_show_secret
from util.security_util import check_auth_claims, check_secret_spot_permission
from util.validators import validate_default_scales, validate_order_payload
from webargs_schemas.sector_args import sector_args


class GetSectors(MethodView):

    def get(self, crag_slug):
        """
        Returns all sectors of a crag.
        """
        crag_id = Crag.get_id_by_slug(crag_slug)
        sectors: Sector = Sector.return_all(
            filter=lambda: Sector.crag_id == crag_id, order_by=lambda: Sector.order_index.asc()
        )
        return jsonify(sectors_schema.dump(sectors)), 200


class GetSector(MethodView):
    def get(self, sector_slug):
        """
        Returns a detailed sector.
        @param sector_slug: Slug of the sector to return.
        """
        sector: Sector = Sector.find_by_slug(sector_slug)
        check_secret_spot_permission(sector)
        return sector_schema.dump(sector), 200


class CreateSector(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def post(self, crag_slug):
        """
        Create a sector.
        """
        crag_id = Crag.get_id_by_slug(crag_slug)
        sector_data = parser.parse(sector_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        valid, error = validate_default_scales(sector_data)
        if not valid:
            raise NotFound(error)

        new_sector: Sector = Sector()
        new_sector.name = sector_data["name"].strip()
        new_sector.description = add_bucket_placeholders(sector_data["description"])
        new_sector.short_description = sector_data["shortDescription"]
        new_sector.portrait_image_id = sector_data["portraitImage"]
        new_sector.rules = add_bucket_placeholders(sector_data["rules"])
        new_sector.crag_id = crag_id
        new_sector.created_by_id = created_by.id
        new_sector.order_index = Sector.find_max_order_index(crag_id) + 1
        new_sector.secret = sector_data["secret"]
        new_sector.map_markers = create_or_update_markers(sector_data["mapMarkers"], new_sector)
        new_sector.closed = sector_data["closed"]
        new_sector.closed_reason = sector_data["closedReason"]
        new_sector.default_boulder_scale = sector_data["defaultBoulderScale"]
        new_sector.default_sport_scale = sector_data["defaultSportScale"]
        new_sector.default_trad_scale = sector_data["defaultTradScale"]

        if not new_sector.secret:
            set_sector_parents_false(new_sector, "secret")
        if not new_sector.closed:
            set_sector_parents_false(new_sector, "closed")
        db.session.add(new_sector)
        db.session.commit()

        HistoryItem.create_history_item(HistoryItemTypeEnum.CREATED, new_sector, created_by)

        return sector_schema.dump(new_sector), 201


class UpdateSector(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, sector_slug):
        """
        Edit a sector.
        @param sector_slug: Slug of the sector to update.
        """
        sector_data = parser.parse(sector_args, request)
        sector: Sector = Sector.find_by_slug(sector_slug)

        valid, error = validate_default_scales(sector_data)
        if not valid:
            raise NotFound(error)

        sector.name = sector_data["name"].strip()
        sector.description = add_bucket_placeholders(sector_data["description"])
        sector.short_description = sector_data["shortDescription"]
        sector.portrait_image_id = sector_data["portraitImage"]
        sector.rules = add_bucket_placeholders(sector_data["rules"])
        update_sector_propagating_boolean_attr(sector, sector_data["secret"], "secret")
        update_sector_propagating_boolean_attr(
            sector, sector_data["closed"], "closed", set_additionally={"closed_reason": sector_data["closedReason"]}
        )
        sector.default_boulder_scale = sector_data["defaultBoulderScale"]
        sector.default_sport_scale = sector_data["defaultSportScale"]
        sector.default_trad_scale = sector_data["defaultTradScale"]

        sector.map_markers = create_or_update_markers(sector_data["mapMarkers"], sector)
        db.session.add(sector)
        db.session.commit()

        return sector_schema.dump(sector), 200


class DeleteSector(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def delete(self, sector_slug):
        """
        Delete a sector.
        @param sector_slug: Slug of the sector to delete.
        """
        sector: Sector = Sector.find_by_slug(sector_slug)

        db.session.delete(sector)
        query = text(
            "UPDATE sectors SET order_index=order_index - 1 WHERE order_index > :order_index AND crag_id = :crag_id"
        )
        db.session.execute(query, {"order_index": sector.order_index, "crag_id": sector.crag_id})
        db.session.commit()

        return jsonify(None), 204


class UpdateSectorOrder(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, crag_slug):
        """
        Changes the order index of sectors.
        """
        new_order = request.json
        crag_id = Crag.get_id_by_slug(crag_slug)
        sectors: List[Sector] = Sector.return_all(filter=lambda: Sector.crag_id == crag_id)

        if not validate_order_payload(new_order, sectors):
            raise BadRequest("New order doesn't match the requirements of the data to order.")

        for sector in sectors:
            sector.order_index = new_order[str(sector.id)]
            db.session.add(sector)

        db.session.commit()

        return jsonify(None), 200


class GetSectorGrades(MethodView):

    def get(self, sector_slug):
        """
        Returns the grades of all lines of a sector.
        """
        instance_settings = InstanceSettings.return_it()
        sector_id = Sector.get_id_by_slug(sector_slug)
        query = (
            db.session.query(
                Line.type,
                Line.grade_scale,
                Line.user_grade_value if instance_settings.display_user_grades_ratings else Line.author_grade_value,
            )
            .join(Area)
            .filter(Area.sector_id == sector_id, Line.archived.is_(False))
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
