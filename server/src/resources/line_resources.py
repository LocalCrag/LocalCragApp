from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.line_schema import lines_schema, line_schema
from models.area import Area
from models.line import Line
from models.sector import Sector
from models.user import User

from webargs_schemas.line_args import line_args


class GetLines(MethodView):

    def get(self, area_slug):
        """
        Returns all lines of an area.
        """
        area_id = Area.get_id_by_slug(area_slug)
        lines: Line = Line.return_all(filter=lambda: Line.area_id == area_id,
                                      order_by=lambda: Line.name.asc())
        return jsonify(lines_schema.dump(lines)), 200


class GetLine(MethodView):
    def get(self, line_slug):
        """
        Returns a detailed line.
        @param line_slug: Slug of the line to return.
        """
        line: Line = Line.find_by_slug(line_slug)
        return line_schema.dump(line), 200


class CreateLine(MethodView):
    @jwt_required()
    def post(self, area_slug):
        """
        Creates a line.
        """
        area_id = Area.get_id_by_slug(area_slug)
        line_data = parser.parse(line_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_line: Line = Line()

        new_line.name = line_data['name']
        new_line.description = line_data['description']
        new_line.video = line_data['video']
        new_line.grade_name = line_data['gradeName']
        new_line.grade_scale = line_data['gradeScale']
        new_line.type = line_data['type']
        new_line.rating = line_data['rating']
        new_line.fa_year = line_data['faYear']
        new_line.fa_name = line_data['faName']

        new_line.sitstart = line_data['sitstart']
        new_line.eliminate = line_data['eliminate']
        new_line.traverse = line_data['traverse']
        new_line.highball = line_data['highball']
        new_line.no_topout = line_data['noTopout']

        new_line.roof = line_data['roof']
        new_line.slab = line_data['slab']
        new_line.vertical = line_data['vertical']
        new_line.overhang = line_data['overhang']

        new_line.athletic = line_data['athletic']
        new_line.technical = line_data['technical']
        new_line.endurance = line_data['endurance']
        new_line.cruxy = line_data['cruxy']
        new_line.dyno = line_data['dyno']

        new_line.jugs = line_data['jugs']
        new_line.sloper = line_data['sloper']
        new_line.crimps = line_data['crimps']
        new_line.pockets = line_data['pockets']
        new_line.pinches = line_data['pinches']

        new_line.crack = line_data['crack']
        new_line.dihedral = line_data['dihedral']
        new_line.compression = line_data['compression']
        new_line.arete = line_data['arete']

        new_line.area_id = area_id
        new_line.created_by_id = created_by.id

        db.session.add(new_line)
        db.session.commit()

        return line_schema.dump(new_line), 201


class UpdateLine(MethodView):
    @jwt_required()
    def put(self, line_slug):
        """
        Edit a line.
        @param line_slug: Slug of the line to update.
        """
        line_data = parser.parse(line_args, request)
        line: Line = Line.find_by_slug(line_slug)

        line.name = line_data['name']
        line.description = line_data['description']
        line.video = line_data['video']
        line.grade_name = line_data['gradeName']
        line.grade_scale = line_data['gradeScale']
        line.type = line_data['type']
        line.rating = line_data['rating']
        line.fa_year = line_data['faYear']
        line.fa_name = line_data['faName']

        line.sitstart = line_data['sitstart']
        line.eliminate = line_data['eliminate']
        line.traverse = line_data['traverse']
        line.highball = line_data['highball']
        line.no_topout = line_data['noTopout']

        line.roof = line_data['roof']
        line.slab = line_data['slab']
        line.vertical = line_data['vertical']
        line.overhang = line_data['overhang']

        line.athletic = line_data['athletic']
        line.technical = line_data['technical']
        line.endurance = line_data['endurance']
        line.cruxy = line_data['cruxy']
        line.dyno = line_data['dyno']

        line.jugs = line_data['jugs']
        line.sloper = line_data['sloper']
        line.crimps = line_data['crimps']
        line.pockets = line_data['pockets']
        line.pinches = line_data['pinches']

        line.crack = line_data['crack']
        line.dihedral = line_data['dihedral']
        line.compression = line_data['compression']
        line.arete = line_data['arete']

        db.session.add(line)
        db.session.commit()

        return line_schema.dump(line), 200


class DeleteLine(MethodView):
    @jwt_required()
    def delete(self, line_slug):
        """
        Delete a line.
        @param line_slug: Slug of the line to delete.
        """
        line: Line = Line.find_by_slug(line_slug)

        db.session.delete(line)
        db.session.commit()

        return jsonify(None), 204
