from collections import Counter, defaultdict

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from marshmallow_schemas.crag_schema import crag_schema, crags_schema
from models.area import Area
from models.ascent import Ascent
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
from util.propagating_boolean_attrs import update_crag_propagating_boolean_attr
from util.secret_spots_auth import get_show_secret
from util.security_util import check_auth_claims, check_secret_spot_permission
from util.validators import validate_default_scales, validate_order_payload
from webargs_schemas.crag_args import crag_args


class GetCrags(MethodView):

    def get(self):
        """
        Returns all crags.
        """
        crags: Crag = Crag.return_all(order_by=lambda: Crag.order_index.asc())
        return jsonify(crags_schema.dump(crags)), 200


class GetCrag(MethodView):
    def get(self, crag_slug):
        """
        Returns a detailed crag.
        @param crag_slug: Slug of the crag to return.
        """
        crag: Crag = Crag.find_by_slug(slug=crag_slug)
        check_secret_spot_permission(crag)
        return crag_schema.dump(crag), 200


class CreateCrag(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def post(self):
        """
        Create a crag.
        """
        crag_data = parser.parse(crag_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        valid, error = validate_default_scales(crag_data)
        if not valid:
            raise NotFound(error)

        new_crag: Crag = Crag()
        new_crag.name = crag_data["name"].strip()
        new_crag.description = add_bucket_placeholders(crag_data["description"])
        new_crag.short_description = crag_data["shortDescription"]
        new_crag.rules = add_bucket_placeholders(crag_data["rules"])
        new_crag.portrait_image_id = crag_data["portraitImage"]
        new_crag.secret = crag_data["secret"]
        new_crag.created_by_id = created_by.id
        new_crag.order_index = Crag.find_max_order_index() + 1
        new_crag.map_markers = create_or_update_markers(crag_data["mapMarkers"], new_crag)
        new_crag.closed = crag_data["closed"]
        new_crag.closed_reason = crag_data["closedReason"]
        new_crag.default_boulder_scale = crag_data["defaultBoulderScale"]
        new_crag.default_sport_scale = crag_data["defaultSportScale"]
        new_crag.default_trad_scale = crag_data["defaultTradScale"]

        db.session.add(new_crag)
        db.session.commit()

        HistoryItem.create_history_item(HistoryItemTypeEnum.CREATED, new_crag, created_by)

        return crag_schema.dump(new_crag), 201


class UpdateCrag(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, crag_slug):
        """
        Edit a crag.
        @param crag_slug: Slug of the crag to update.
        """
        crag_data = parser.parse(crag_args, request)
        crag: Crag = Crag.find_by_slug(crag_slug)

        valid, error = validate_default_scales(crag_data)
        if not valid:
            raise NotFound(error)

        crag.name = crag_data["name"].strip()
        crag.description = add_bucket_placeholders(crag_data["description"])
        crag.short_description = crag_data["shortDescription"]
        crag.rules = add_bucket_placeholders(crag_data["rules"])
        crag.portrait_image_id = crag_data["portraitImage"]
        update_crag_propagating_boolean_attr(crag, crag_data["secret"], "secret")
        update_crag_propagating_boolean_attr(
            crag, crag_data["closed"], "closed", set_additionally={"closed_reason": crag_data["closedReason"]}
        )
        crag.default_boulder_scale = crag_data["defaultBoulderScale"]
        crag.default_sport_scale = crag_data["defaultSportScale"]
        crag.default_trad_scale = crag_data["defaultTradScale"]

        crag.map_markers = create_or_update_markers(crag_data["mapMarkers"], crag)
        db.session.add(crag)
        db.session.commit()

        return crag_schema.dump(crag), 200


class DeleteCrag(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def delete(self, crag_slug):
        """
        Delete a crag.
        @param crag_slug: Slug of the crag to delete.
        """
        crag: Crag = Crag.find_by_slug(crag_slug)

        db.session.delete(crag)
        query = text("UPDATE crags SET order_index=order_index - 1 WHERE order_index > :order_index")
        db.session.execute(query, {"order_index": crag.order_index})
        db.session.commit()

        return jsonify(None), 204


class UpdateCragOrder(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self):
        """
        Changes the order index of crags.
        """
        new_order = request.json
        crags = Crag.return_all()

        if not validate_order_payload(new_order, crags):
            raise BadRequest("New order doesn't match the requirements of the data to order.")

        for crag in crags:
            crag.order_index = new_order[str(crag.id)]
            db.session.add(crag)

        db.session.commit()

        return jsonify(None), 200


class GetCragGrades(MethodView):

    def get(self, crag_slug):
        """
        Returns the grades of all lines of a crag.
        """
        instance_settings = InstanceSettings.return_it()
        crag_id = Crag.get_id_by_slug(crag_slug)
        query = (
            db.session.query(
                Line.type,
                Line.grade_scale,
                Line.user_grade_value if instance_settings.display_user_grades_ratings else Line.author_grade_value,
            )
            .join(Area)
            .join(Sector)
            .filter(Sector.crag_id == crag_id, Line.archived.is_(False))
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


class GetCragSeason(MethodView):

    def get(self, crag_slug):
        """
        Get the number of ascents for a crag for each month of the year.
        """
        crag_id = Crag.get_id_by_slug(crag_slug)

        # Query for all ascent dates for the crag
        ascents = db.session.query(Ascent.date).filter(Ascent.date.isnot(None)).filter(Ascent.crag_id == crag_id).all()

        # Initialize dictionary to store counts
        season_counts = {i: 0 for i in range(1, 13)}

        # Count ascents for each month
        for ascent in ascents:
            month = ascent.date.month
            if month in season_counts:
                season_counts[month] += 1

        # Normalize the counts to a percentage of the total ascents
        total_ascents = sum(season_counts.values())
        if total_ascents > 0:
            season_counts = {k: v / total_ascents for k, v in season_counts.items()}

        return season_counts
