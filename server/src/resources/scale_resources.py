from typing import Optional

from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy import or_
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.conflict import Conflict
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from marshmallow_schemas.scale_schema import scale_schema, scales_schema
from messages.messages import ResponseMessage
from models.line import Line
from models.ranking import Ranking
from models.rock_explorer_feature import RockExplorerFeature
from models.scale import Scale
from util.auth_session import session_required
from webargs_schemas.scale_args import scale_args


class GetScales(MethodView):
    def get(self):
        scale = Scale.query.all()

        return jsonify(scales_schema.dump(scale)), 200


class GetScale(MethodView):
    def get(self, line_type, name):
        scale = Scale.query.filter_by(name=name, type=line_type).first()
        if scale is None:
            raise NotFound()

        return jsonify(scale_schema.dump(scale)), 200


class CreateScale(MethodView):
    @session_required(admin=True)
    def post(self):
        scale_data = parser.parse(scale_args, request)

        # All values used in the grade brackets must be in the grades
        all_grades = set(g["value"] for g in scale_data["grades"])
        if any(gb.get("value") not in all_grades for gb in scale_data["gradeBrackets"]["stackedChartBrackets"]):
            raise BadRequest(ResponseMessage.INVALID_STACKED_CHART_BRACKETS)
        if any(gb.get("value") not in all_grades for gb in scale_data["gradeBrackets"]["barChartBrackets"]):
            raise BadRequest(ResponseMessage.INVALID_BAR_CHART_BRACKETS)

        scale = Scale()
        scale.name = scale_data["name"]
        scale.type = scale_data["type"]
        scale.grades = scale_data["grades"]
        scale.grade_brackets = scale_data["gradeBrackets"]
        db.session.add(scale)
        db.session.commit()

        return jsonify(scale_schema.dump(scale)), 201


def _scale_has_lines(line_type, name) -> bool:
    return db.session.query(Line.id).filter(Line.grade_scale == name, Line.type == line_type).first() is not None


def _scale_drops_grade_in_use(line_type, name, values: set) -> bool:
    if not _scale_has_lines(line_type, name):
        return False
    if not values:
        return True
    return (
        db.session.query(Line.id)
        .filter(
            Line.grade_scale == name,
            Line.type == line_type,
            or_(
                Line.author_grade_value.notin_(values),
                Line.user_grade_value.notin_(values),
            ),
        )
        .first()
        is not None
    )


def _rename_scale_references(line_type: str, old_name: str, new_name: str) -> None:
    Line.query.filter(Line.grade_scale == old_name, Line.type == line_type).update(
        {Line.grade_scale: new_name},
        synchronize_session=False,
    )
    Ranking.query.filter(Ranking.scale == old_name, Ranking.type == line_type).update(
        {Ranking.scale: new_name},
        synchronize_session=False,
    )
    RockExplorerFeature.query.filter(
        RockExplorerFeature.grade_scale == old_name,
        RockExplorerFeature.grade_line_type == line_type,
    ).update({RockExplorerFeature.grade_scale: new_name}, synchronize_session=False)


class UpdateScale(MethodView):
    @session_required(admin=True)
    def put(self, line_type, name):
        scale: Optional[Scale] = Scale.query.filter_by(name=name, type=line_type).first()
        if scale is None:
            raise NotFound()

        scale_data = parser.parse(scale_args, request)

        if scale.is_default and str(scale.type) != str(scale_data["type"]):
            raise Conflict(ResponseMessage.CANNOT_CHANGE_DEFAULT_SCALE.value)

        # Line type and used grade values are checked in SQL so a large area
        # does not load every line and its ascents into the session.
        if str(scale.type) != str(scale_data["type"]) and _scale_has_lines(line_type, name):
            raise Conflict(ResponseMessage.CANNOT_CHANGE_SCALES_CONFLICTING_LINES.value)

        values = {s["value"] for s in scale_data["grades"]}
        if _scale_drops_grade_in_use(line_type, name, values):
            raise Conflict(ResponseMessage.CANNOT_CHANGE_SCALES_CONFLICTING_LINES.value)

        # All values used in the grade brackets must be in the grades
        all_grades = set(g["value"] for g in scale_data["grades"])
        if any(gb.get("value") not in all_grades for gb in scale_data["gradeBrackets"]["stackedChartBrackets"]):
            raise BadRequest(ResponseMessage.INVALID_STACKED_CHART_BRACKETS)
        if any(gb.get("value") not in all_grades for gb in scale_data["gradeBrackets"]["barChartBrackets"]):
            raise BadRequest(ResponseMessage.INVALID_BAR_CHART_BRACKETS)

        new_name = scale_data["name"]
        if new_name != name:
            _rename_scale_references(line_type, name, new_name)

        scale.name = new_name
        scale.type = scale_data["type"]
        scale.grades = scale_data["grades"]
        scale.grade_brackets = scale_data["gradeBrackets"]

        db.session.add(scale)
        db.session.commit()

        return jsonify(scale_schema.dump(scale)), 200


class DeleteScale(MethodView):
    @session_required(admin=True)
    def delete(self, line_type, name):
        scale = Scale.query.filter_by(name=name, type=line_type).first()
        if scale is None:
            raise NotFound()
        if scale.is_default:
            raise Conflict(ResponseMessage.CANNOT_CHANGE_DEFAULT_SCALE.value)
        if Line.query.filter(Line.grade_scale == name, Line.type == line_type).count() > 0:
            raise Conflict(ResponseMessage.CANNOT_CHANGE_SCALES_CONFLICTING_LINES.value)

        db.session.delete(scale)
        db.session.commit()

        return jsonify(None), 204


class SetDefaultScale(MethodView):
    @session_required(admin=True)
    def put(self, line_type, name):
        scale: Optional[Scale] = Scale.query.filter_by(name=name, type=line_type).first()
        if scale is None:
            raise NotFound()

        Scale.query.filter(Scale.type == line_type, Scale.name != name).update(
            {Scale.is_default: False},
            synchronize_session=False,
        )
        scale.is_default = True
        db.session.commit()

        return jsonify(scale_schema.dump(scale)), 200
