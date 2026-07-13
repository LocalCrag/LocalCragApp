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
from marshmallow_schemas.search_schema import sector_search_schema
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
from util.html_inline_styles import sanitize_wysiwyg_html
from util.propagating_boolean_attrs import (
    set_sector_parents_false,
    update_sector_propagating_boolean_attr,
)
from util.scheduled_closure import (
    apply_closable_configuration,
    finalize_closable_save,
)
from util.secret_service import SecretService
from util.security_util import check_auth_claims, check_secret_spot_permission
from util.topo_entity_counts import attach_sector_counts
from util.validators import validate_default_scales, validate_order_payload
from webargs_schemas.move_args import move_sector_args
from webargs_schemas.sector_args import sector_args


class MoveSector(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, sector_slug):
        """
        Move a sector to a different crag.
        """
        payload = parser.parse(move_sector_args, request)
        target_crag_id = payload["cragId"]

        sector: Sector = Sector.find_by_slug(sector_slug)
        old_crag_id = sector.crag_id
        target_crag_id = Crag.find_by_id(target_crag_id).id

        if target_crag_id == old_crag_id:
            return sector_schema.dump(sector), 200

        # Close the gap in the old crag order
        db.session.execute(
            text(
                "UPDATE sectors SET order_index=order_index - 1 "
                "WHERE order_index > :order_index AND crag_id = :crag_id"
            ),
            {"order_index": sector.order_index, "crag_id": old_crag_id},
        )

        # Append to the end in the new crag
        sector.crag_id = target_crag_id
        sector.order_index = Sector.find_max_order_index(target_crag_id) + 1

        # If the target crag is secret or closed, propagate to the moved sector and descendants.
        target_crag: Crag = Crag.find_by_id(target_crag_id)
        if target_crag.secret and not sector.secret:
            update_sector_propagating_boolean_attr(sector, True, "secret")
        if target_crag.closed and not sector.closed:
            update_sector_propagating_boolean_attr(sector, True, "closed")

        db.session.add(sector)
        db.session.commit()

        return sector_search_schema.dump(sector), 200


class GetSectors(MethodView):

    def get(self, crag_slug):
        """
        Returns all sectors of a crag.
        """
        crag_id = Crag.get_id_by_slug(crag_slug)
        sectors: Sector = Sector.return_all(
            filter=lambda: Sector.crag_id == crag_id, order_by=lambda: Sector.order_index.asc()
        )
        attach_sector_counts(sectors)
        SecretService.attach_secret_flags(sectors)
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
        new_sector.description = sanitize_wysiwyg_html(sector_data["description"])
        new_sector.short_description = sanitize_wysiwyg_html(sector_data["shortDescription"])
        new_sector.portrait_image_id = sector_data["portraitImage"]
        new_sector.rules = sanitize_wysiwyg_html(sector_data["rules"])
        new_sector.crag_id = crag_id
        new_sector.created_by_id = created_by.id
        new_sector.order_index = Sector.find_max_order_index(crag_id) + 1
        new_sector.secret = sector_data["secret"]
        new_sector.map_markers = create_or_update_markers(sector_data["mapMarkers"], new_sector)
        new_sector.default_boulder_scale = sector_data["defaultBoulderScale"]
        new_sector.default_sport_scale = sector_data["defaultSportScale"]
        new_sector.default_trad_scale = sector_data["defaultTradScale"]
        new_sector.blocweather_url = sector_data["blocweatherUrl"]

        apply_closable_configuration(new_sector, sector_data, "sector_id")
        if not new_sector.secret:
            set_sector_parents_false(new_sector, "secret")
        db.session.commit()
        finalize_closable_save(new_sector)

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
        sector.description = sanitize_wysiwyg_html(sector_data["description"])
        sector.short_description = sanitize_wysiwyg_html(sector_data["shortDescription"])
        sector.portrait_image_id = sector_data["portraitImage"]
        sector.rules = sanitize_wysiwyg_html(sector_data["rules"])
        update_sector_propagating_boolean_attr(sector, sector_data["secret"], "secret")
        apply_closable_configuration(sector, sector_data, "sector_id")
        sector.default_boulder_scale = sector_data["defaultBoulderScale"]
        sector.default_sport_scale = sector_data["defaultSportScale"]
        sector.default_trad_scale = sector_data["defaultTradScale"]
        sector.blocweather_url = sector_data["blocweatherUrl"]

        sector.map_markers = create_or_update_markers(sector_data["mapMarkers"], sector)
        db.session.add(sector)
        db.session.commit()
        finalize_closable_save(sector)

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
                Line.user_grade_value if instance_settings.display_user_grades else Line.author_grade_value,
            )
            .join(Area)
            .filter(Area.sector_id == sector_id, Line.archived.is_(False))
        )
        query = SecretService.apply_line_filter(query)
        result = query.all()

        response_data = {
            LineTypeEnum.BOULDER.value: defaultdict(Counter),
            LineTypeEnum.SPORT.value: defaultdict(Counter),
            LineTypeEnum.TRAD.value: defaultdict(Counter),
        }
        for lineType, gradeScale, gradeValue in result:
            response_data[lineType.value][gradeScale].update({gradeValue: 1})

        return jsonify(response_data), 200
