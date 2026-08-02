from collections import Counter, defaultdict
from typing import List

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func, text
from sqlalchemy.orm import joinedload
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from marshmallow_schemas.area_schema import area_schema, areas_schema
from marshmallow_schemas.search_schema import area_search_schema, areas_search_schema
from models.area import Area
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
    set_area_parents_false,
    update_area_propagating_boolean_attr,
)
from util.scheduled_closure import (
    apply_closable_configuration,
    finalize_closable_save,
)
from util.secret_service import SecretService
from util.security_util import check_auth_claims, check_secret_spot_permission
from util.topo_entity_counts import attach_area_counts
from util.validators import validate_default_scales, validate_order_payload
from webargs_schemas.area_args import area_args
from webargs_schemas.move_args import move_area_args


class MoveArea(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, area_slug):
        """
        Move an area to a different sector.
        """
        payload = parser.parse(move_area_args, request)
        target_sector_id = payload["sectorId"]

        area: Area = Area.find_by_slug(area_slug)
        old_sector_id = area.sector_id
        target_sector_id = Sector.find_by_id(target_sector_id).id

        if target_sector_id == old_sector_id:
            return area_schema.dump(area), 200

        # Close the gap in the old sector order
        db.session.execute(
            text(
                "UPDATE areas SET order_index=order_index - 1 "
                "WHERE order_index > :order_index AND sector_id = :sector_id"
            ),
            {"order_index": area.order_index, "sector_id": old_sector_id},
        )

        # Append to the end in the new sector
        area.sector_id = target_sector_id
        area.order_index = Area.find_max_order_index(target_sector_id) + 1

        # If the target sector is secret or closed, propagate to the moved area and descendants.
        target_sector: Sector = Sector.find_by_id(target_sector_id)
        if target_sector.secret and not area.secret:
            update_area_propagating_boolean_attr(area, True, "secret")
        if target_sector.closed and not area.closed:
            update_area_propagating_boolean_attr(area, True, "closed")

        db.session.add(area)
        db.session.commit()

        return area_search_schema.dump(area), 200


class GetAreas(MethodView):

    def get(self, sector_slug):
        """
        Returns all areas of a sector.
        """
        sector_id = Sector.get_id_by_slug(sector_slug)
        areas: List[Area] = Area.return_all(
            filter=lambda: Area.sector_id == sector_id, order_by=lambda: Area.order_index.asc()
        )
        attach_area_counts(areas)
        SecretService.attach_secret_flags(areas)
        return jsonify(areas_schema.dump(areas)), 200


class FindAreasByName(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def get(self):
        """
        Returns all areas whose name matches (case-insensitive, trimmed).
        Optionally excludes an area by id via excludeId.
        """
        name = (request.args.get("name") or "").strip()
        if not name:
            return jsonify([]), 200
        exclude_id = (request.args.get("excludeId") or "").strip() or None
        query = Area.query.options(joinedload(Area.sector).joinedload(Sector.crag)).filter(
            func.lower(Area.name) == name.lower()
        )
        if exclude_id:
            query = query.filter(Area.id != exclude_id)
        matches = query.order_by(Area.name.asc()).all()
        return jsonify(areas_search_schema.dump(matches)), 200


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
        new_area.description = sanitize_wysiwyg_html(area_data["description"])
        new_area.short_description = sanitize_wysiwyg_html(area_data["shortDescription"])
        new_area.portrait_image_id = area_data["portraitImage"]
        new_area.sector_id = sector_id
        new_area.created_by_id = created_by.id
        new_area.order_index = Area.find_max_order_index(sector_id) + 1
        new_area.secret = area_data["secret"]
        new_area.map_markers = create_or_update_markers(area_data["mapMarkers"], new_area)
        new_area.default_boulder_scale = area_data["defaultBoulderScale"]
        new_area.default_sport_scale = area_data["defaultSportScale"]
        new_area.default_trad_scale = area_data["defaultTradScale"]
        new_area.blocweather_url = area_data["blocweatherUrl"]

        apply_closable_configuration(new_area, area_data, "area_id")
        if not new_area.secret:
            set_area_parents_false(new_area, "secret")

        db.session.commit()
        finalize_closable_save(new_area)

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
        area.description = sanitize_wysiwyg_html(area_data["description"])
        area.short_description = sanitize_wysiwyg_html(area_data["shortDescription"])
        area.portrait_image_id = area_data["portraitImage"]
        update_area_propagating_boolean_attr(area, area_data["secret"], "secret")
        apply_closable_configuration(area, area_data, "area_id")
        area.default_boulder_scale = area_data["defaultBoulderScale"]
        area.default_sport_scale = area_data["defaultSportScale"]
        area.default_trad_scale = area_data["defaultTradScale"]
        area.blocweather_url = area_data["blocweatherUrl"]

        area.map_markers = create_or_update_markers(area_data["mapMarkers"], area)
        db.session.add(area)
        db.session.commit()
        finalize_closable_save(area)

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
        instance_settings = InstanceSettings.return_it()
        area_id = Area.get_id_by_slug(area_slug)
        query = db.session.query(
            Line.type,
            Line.grade_scale,
            Line.user_grade_value if instance_settings.display_user_grades else Line.author_grade_value,
        ).filter(Line.area_id == area_id, Line.archived.is_(False))
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
