from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.conflict import Conflict
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from marshmallow_schemas.grades_schema import grades_list_schema, grades_schema
from messages.messages import ResponseMessage
from models.grades import Grades
from models.line import Line
from util.security_util import check_auth_claims
from webargs_schemas.grades_args import grades_args


class GetGradesList(MethodView):
    def get(self):
        grades = Grades.query.all()

        return jsonify(grades_list_schema.dump(grades)), 200


class GetGrades(MethodView):
    def get(self, line_type, name):
        grades = Grades.query.filter_by(name=name, type=line_type).first()

        return jsonify(grades_schema.dump(grades)), 200


class CreateGrades(MethodView):
    @jwt_required()
    @check_auth_claims(admin=True)
    def post(self):
        grades_data = parser.parse(grades_args, request)

        grades = Grades()
        grades.name = grades_data["name"]
        grades.type = grades_data["type"]
        grades.grades = grades_data["grades"]
        db.session.add(grades)
        db.session.commit()

        return jsonify(grades_schema.dump(grades)), 201


class UpdateGrades(MethodView):
    @jwt_required()
    @check_auth_claims(admin=True)
    def put(self, line_type, name):
        grades: Grades | None = Grades.query.filter_by(name=name, type=line_type).first()
        if grades is None:
            raise NotFound()

        grades_data = parser.parse(grades_args, request)

        lines = Line.query.filter(Line.grade_scale == name, Line.type == line_type).all()

        # Line Type may only be changed if no lines use this scale
        if str(grades.type) != str(grades_data["type"]) and len(lines) > 0:
            raise Conflict(ResponseMessage.CANNOT_CHANGE_GRADES_CONFLICTING_LINES.value)

        # All values set on lines must still be there
        scale = {g["value"]: g["name"] for g in grades_data["grades"]}
        values = set(scale.keys())
        for line in lines:
            if line.grade_value not in values:
                raise Conflict(ResponseMessage.CANNOT_CHANGE_GRADES_CONFLICTING_LINES.value)

        grades.name = grades_data["name"]
        grades.type = grades_data["type"]
        grades.grades = grades_data["grades"]

        for line in lines:
            line.grade_scale = grades.name
            line.grade_name = scale[line.grade_value]
            db.session.add(line)

        db.session.add(grades)
        db.session.commit()

        return jsonify(grades_schema.dump(grades)), 200


class DeleteGrades(MethodView):
    @jwt_required()
    @check_auth_claims(admin=True)
    def delete(self, line_type, name):
        grades = Grades.query.filter_by(name=name, type=line_type).first()
        if grades is None:
            raise NotFound()
        if Line.query.filter(Line.grade_scale == name, Line.type == line_type).count() > 0:
            raise Conflict(ResponseMessage.CANNOT_CHANGE_GRADES_CONFLICTING_LINES.value)

        db.session.delete(grades)
        db.session.commit()

        return jsonify(None), 204
