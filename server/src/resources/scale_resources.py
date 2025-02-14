from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.conflict import Conflict
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from marshmallow_schemas.scale_schema import scale_schema, scales_schema
from messages.messages import ResponseMessage
from models.line import Line
from models.scale import Scale
from util.security_util import check_auth_claims
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
    @jwt_required()
    @check_auth_claims(admin=True)
    def post(self):
        scale_data = parser.parse(scale_args, request)

        all_grades = set(g["value"] for g in scale_data["grades"])
        if any(gb not in all_grades for gb in scale_data["gradeBrackets"]):
            raise BadRequest(ResponseMessage.INVALID_SCALES_GRADE_BRACKETS)

        scale = Scale()
        scale.name = scale_data["name"]
        scale.type = scale_data["type"]
        scale.grades = scale_data["grades"]
        scale.grade_brackets = scale_data["gradeBrackets"]
        db.session.add(scale)
        db.session.commit()

        return jsonify(scale_schema.dump(scale)), 201


class UpdateScale(MethodView):
    @jwt_required()
    @check_auth_claims(admin=True)
    def put(self, line_type, name):
        scale: Scale | None = Scale.query.filter_by(name=name, type=line_type).first()
        if scale is None:
            raise NotFound()

        scale_data = parser.parse(scale_args, request)

        lines = Line.query.filter(Line.grade_scale == name, Line.type == line_type).all()

        # Line Type may only be changed if no lines use this scale
        if str(scale.type) != str(scale_data["type"]) and len(lines) > 0:
            raise Conflict(ResponseMessage.CANNOT_CHANGE_SCALES_CONFLICTING_LINES.value)

        # All values set on lines must still be there
        values = {s["value"] for s in scale_data["grades"]}
        for line in lines:
            if line.grade_value not in values:
                raise Conflict(ResponseMessage.CANNOT_CHANGE_SCALES_CONFLICTING_LINES.value)

        # All values used in the grade brackets must be in the grades
        all_grades = set(g["value"] for g in scale_data["grades"])
        if any(gb not in all_grades for gb in scale_data["gradeBrackets"]["stackedChartBrackets"]):
            raise BadRequest(ResponseMessage.INVALID_STACKED_CHART_BRACKETS)
        if any(gb.get("value") not in all_grades for gb in scale_data["gradeBrackets"]["barChartBrackets"]):
            raise BadRequest(ResponseMessage.INVALID_BAR_CHART_BRACKETS)

        scale.name = scale_data["name"]
        scale.type = scale_data["type"]
        scale.grades = scale_data["grades"]
        scale.grade_brackets = scale_data["gradeBrackets"]

        for line in lines:
            line.grade_scale = scale.name
            db.session.add(line)

        db.session.add(scale)
        db.session.commit()

        return jsonify(scale_schema.dump(scale)), 200


class DeleteScale(MethodView):
    @jwt_required()
    @check_auth_claims(admin=True)
    def delete(self, line_type, name):
        scale = Scale.query.filter_by(name=name, type=line_type).first()
        if scale is None:
            raise NotFound()
        if Line.query.filter(Line.grade_scale == name, Line.type == line_type).count() > 0:
            raise Conflict(ResponseMessage.CANNOT_CHANGE_SCALES_CONFLICTING_LINES.value)

        db.session.delete(scale)
        db.session.commit()

        return jsonify(None), 204
