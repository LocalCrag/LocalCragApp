from typing import List

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.area_schema import areas_schema, area_schema
from marshmallow_schemas.ascent_schema import ascent_schema, ascents_schema
from marshmallow_schemas.sector_schema import sectors_schema, sector_schema
from models.area import Area
from models.ascent import Ascent
from models.crag import Crag
from models.enums.line_type_enum import LineTypeEnum
from models.grades import GRADES, get_grade_value
from models.line import Line
from models.sector import Sector
from models.topo_image import TopoImage
from models.user import User
from util.bucket_placeholders import add_bucket_placeholders
from util.security_util import check_auth_claims
from util.validators import validate_order_payload, cross_validate_grade

from webargs_schemas.area_args import area_args
from webargs_schemas.ascent_args import ascent_args, cross_validate_ascent_args
from webargs_schemas.topo_image_args import topo_image_args


class GetAscents(MethodView):

    def get(self):
        ascents: List[Ascent] = (db.session.query(Ascent)
                                 .join(Line)
                                 .join(Area) #todo slow, uses many many selects and dosn't join correctly
                                 .join(Sector)
                                 .join(Crag)
                                 .order_by(lambda: Ascent.time_created.desc()).all())# Ascent.return_all(order_by=lambda: Ascent.time_created.desc())
        return jsonify(ascents_schema.dump(ascents)), 200

#
# class GetArea(MethodView):
#     def get(self, area_slug):
#         """
#         Returns a detailed area.
#         @param area_slug: Slug of the area to return.
#         """
#         area: Area = Area.find_by_slug(area_slug)
#         return area_schema.dump(area), 200
#

class CreateAscent(MethodView):
    @jwt_required()
    def post(self):
        ascent_data = parser.parse(ascent_args, request, validate=cross_validate_ascent_args)
        created_by = User.find_by_email(get_jwt_identity())

        line: Line = Line.find_by_id(ascent_data['line'])
        if not line:
            raise BadRequest('Line doesn\'t exist.')
        if get_grade_value(ascent_data['gradeName'], ascent_data['gradeScale'], line.type) < 0:
            raise BadRequest('Projects cannot be ticked.')
        if ascent_data['gradeScale'] != line.grade_scale:
            raise BadRequest('Cannot change grade scale of the climbed line.')
        if not cross_validate_grade(ascent_data['gradeName'], ascent_data['gradeScale'], line.type):
            raise BadRequest('Grade scale, name and line type do not match.')

        ascent: Ascent = Ascent()
        ascent.line_id = ascent_data['line']
        ascent.flash = ascent_data['flash']
        ascent.fa = ascent_data['fa']
        ascent.soft = ascent_data['soft']
        ascent.hard = ascent_data['hard']
        ascent.with_kneepad = ascent_data['withKneepad']
        ascent.grade_name = ascent_data['gradeName']
        ascent.grade_scale = ascent_data['gradeScale']
        ascent.rating = ascent_data['rating']
        ascent.comment = ascent_data['comment']
        ascent.year = ascent_data['year']
        ascent.date = ascent_data['date']
        ascent.created_by_id = created_by.id

        db.session.add(ascent)
        db.session.commit()

        return ascent_schema.dump(ascent), 201

#
# class UpdateArea(MethodView):
#     @jwt_required()
#     @check_auth_claims(moderator=True)
#     def put(self, area_slug):
#         """
#         Edit an area.
#         @param area_slug: Slug of the area to update.
#         """
#         area_data = parser.parse(area_args, request)
#         area: Area = Area.find_by_slug(area_slug)
#
#         area.name = area_data['name']
#         area.lat = area_data['lat']
#         area.lng = area_data['lng']
#         area.description = add_bucket_placeholders(area_data['description'])
#         area.short_description = area_data['shortDescription']
#         area.portrait_image_id = area_data['portraitImage']
#         db.session.add(area)
#         db.session.commit()
#
#         return area_schema.dump(area), 200
#
#
# class DeleteArea(MethodView):
#     @jwt_required()
#     @check_auth_claims(moderator=True)
#     def delete(self, area_slug):
#         """
#         Delete an area.
#         @param area_slug: Slug of the area to delete.
#         """
#         area: Area = Area.find_by_slug(area_slug)
#
#         db.session.delete(area)
#         query = text("UPDATE areas SET order_index=order_index - 1 WHERE order_index > :order_index AND sector_id = :sector_id")
#         db.session.execute(query, {'order_index': area.order_index, 'sector_id': area.sector_id})
#         db.session.commit()
#
#         return jsonify(None), 204

