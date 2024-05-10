import datetime
from typing import List

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request, get_jwt
from sqlalchemy import text
from sqlalchemy.orm import joinedload
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.area_schema import areas_schema, area_schema
from marshmallow_schemas.ascent_schema import ascent_schema, ascents_schema, \
    paginated_ascents_schema
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
from webargs_schemas.ascent_args import ascent_args, cross_validate_ascent_args, ticks_args
from webargs_schemas.topo_image_args import topo_image_args


class GetAscents(MethodView):

    def get(self):

        user_id = request.args.get('user_id')
        crag_id = request.args.get('crag_id')
        sector_id = request.args.get('sector_id')
        area_id = request.args.get('area_id')
        line_id = request.args.get('line_id')
        page = int(request.args.get('page'))
        order_by = request.args.get('order_by') or 'time_created'
        order_direction = request.args.get('order_direction') or 'desc'

        if order_by not in ['time_created', 'ascent_date'] or order_direction not in ['asc', 'desc']:
            raise BadRequest('Invalid order by query parameters')

        query = db.session.query(Ascent)

        if crag_id:
            query = query.filter(Ascent.crag_id == crag_id)
        if sector_id:
            query = query.filter(Ascent.sector_id == sector_id)
        if area_id:
            query = query.filter(Ascent.area_id == area_id)
        if user_id:
            query = query.filter(Ascent.created_by_id == user_id)
        if line_id:
            query = query.filter(Ascent.line_id == line_id)

        # Handle secret spots
        has_jwt = bool(verify_jwt_in_request(optional=True))
        claims = get_jwt()
        if not has_jwt or (not claims['admin'] and not claims['moderator'] and not claims['member']):
            query = query.filter(Ascent.line.has(secret=False))

        query = query.order_by(text('{} {}'.format(order_by, order_direction)))

        paginated_ascents = db.paginate(query, page=page, per_page=20)

        return jsonify(paginated_ascents_schema.dump(paginated_ascents)), 200


class GetTicks(MethodView):

    def get(self):
        user_id = request.args.get('user_id')
        crag_id = request.args.get('crag_id')
        sector_id = request.args.get('sector_id')
        area_id = request.args.get('area_id')
        line_id = request.args.get('line_id')
        if not user_id or not (crag_id or sector_id or area_id or line_id):
            raise BadRequest('Filter query params are not properly defined.')
        query = db.session.query(Ascent.line_id).filter(Ascent.created_by_id == user_id)
        if crag_id:
            query = query.filter(Ascent.crag_id == crag_id)
        if sector_id:
            query = query.filter(Ascent.sector_id == sector_id)
        if area_id:
            query = query.filter(Ascent.area_id == area_id)
        if line_id:
            query = query.filter(Ascent.line_id == line_id)
        line_ids = [row[0] for row in query.all()]
        return jsonify(line_ids), 200


class CreateAscent(MethodView):
    @jwt_required()
    def post(self):
        ascent_data = parser.parse(ascent_args, request, validate=cross_validate_ascent_args)
        created_by = User.find_by_email(get_jwt_identity())

        line: Line = Line.find_by_id(ascent_data['line'])
        if get_grade_value(ascent_data['gradeName'], ascent_data['gradeScale'], line.type) < 0:
            raise BadRequest('Projects cannot be ticked.')
        if ascent_data['gradeScale'] != line.grade_scale:
            raise BadRequest('Cannot change grade scale of the climbed line.')
        if not cross_validate_grade(ascent_data['gradeName'], ascent_data['gradeScale'], line.type):
            raise BadRequest('Grade scale, name and line type do not match.')
        if db.session.query(Ascent.line_id).filter(Ascent.created_by_id == created_by.id).filter(
                Ascent.line_id == ascent_data['line']).first():
            raise BadRequest('Cannot log a line twice.')

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
        ascent.area_id = line.area_id
        ascent.sector_id = Area.find_by_id(line.area_id).sector_id
        ascent.crag_id = Sector.find_by_id(ascent.sector_id).crag_id

        # Set ascent date for ordering
        if ascent.date:
            ascent.ascent_date = ascent.date
        else:
            ascent.ascent_date = datetime.datetime.strptime(str(ascent.year), '%Y').date()

        line.ascent_count += 1

        db.session.add(line)
        db.session.add(ascent)
        increment_ascent_counts(ascent)
        db.session.commit()

        return ascent_schema.dump(ascent), 201


class UpdateAscent(MethodView):
    @jwt_required()
    def put(self, ascent_id):
        ascent_data = parser.parse(ascent_args, request, validate=cross_validate_ascent_args)
        ascent: Ascent = Ascent.find_by_id(ascent_id)

        if not ascent.created_by.email == get_jwt_identity():
            raise Unauthorized('Ascents can only be edited by users themselves.')

        line: Line = Line.find_by_id(ascent.line_id)
        if ascent_data['gradeScale'] != line.grade_scale:
            raise BadRequest('Cannot change grade scale of the climbed line.')
        if not cross_validate_grade(ascent_data['gradeName'], ascent_data['gradeScale'], line.type):
            raise BadRequest('Grade scale, name and line type do not match.')

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

        # Set ascent date for ordering
        if ascent.date:
            ascent.ascent_date = ascent.date
        else:
            ascent.ascent_date = datetime.datetime.strptime(str(ascent.year), '%Y').date()

        db.session.add(ascent)
        db.session.commit()

        return ascent_schema.dump(ascent), 201


class DeleteAscent(MethodView):
    @jwt_required()
    def delete(self, ascent_id):
        ascent: Ascent = Ascent.find_by_id(ascent_id)

        if not ascent.created_by.email == get_jwt_identity():
            raise Unauthorized('Ascents can only be deleted by users themselves.')

        db.session.delete(ascent)
        decrement_ascent_counts(ascent)
        db.session.commit()

        return jsonify(None), 204


def increment_ascent_counts(ascent: Ascent):
    query = text("UPDATE lines SET ascent_count=ascent_count + 1 WHERE id  = :line_id")
    db.session.execute(query, {'line_id': ascent.line_id})
    query = text("UPDATE areas SET ascent_count=ascent_count + 1 WHERE id  = :area_id")
    db.session.execute(query, {'area_id': ascent.area_id})
    query = text("UPDATE sectors SET ascent_count=ascent_count + 1 WHERE id  = :sector_id")
    db.session.execute(query, {'sector_id': ascent.sector_id})
    query = text("UPDATE crags SET ascent_count=ascent_count + 1 WHERE id  = :crag_id")
    db.session.execute(query, {'crag_id': ascent.crag_id})
    query = text("UPDATE regions SET ascent_count=ascent_count + 1")
    db.session.execute(query)


def decrement_ascent_counts(ascent: Ascent):
    query = text("UPDATE lines SET ascent_count=ascent_count - 1 WHERE id  = :line_id")
    db.session.execute(query, {'line_id': ascent.line_id})
    query = text("UPDATE areas SET ascent_count=ascent_count - 1 WHERE id  = :area_id")
    db.session.execute(query, {'area_id': ascent.area_id})
    query = text("UPDATE sectors SET ascent_count=ascent_count - 1 WHERE id  = :sector_id")
    db.session.execute(query, {'sector_id': ascent.sector_id})
    query = text("UPDATE crags SET ascent_count=ascent_count - 1 WHERE id  = :crag_id")
    db.session.execute(query, {'crag_id': ascent.crag_id})
    query = text("UPDATE regions SET ascent_count=ascent_count - 1")
    db.session.execute(query)
