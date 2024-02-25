from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.crag_schema import crag_schema, crags_schema
from marshmallow_schemas.region_schema import region_schema
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.region import Region
from models.sector import Sector
from models.user import User
from util.validators import validate_order_payload
from webargs_schemas.crag_args import crag_args
from webargs_schemas.region_args import region_args


class GetRegion(MethodView):
    def get(self, region_slug):
        """
        Returns a detailed region.
        @param region_slug: Slug of the region to return.
        """
        region: Region = Region.find_by_slug(slug=region_slug)
        return region_schema.dump(region), 200


class UpdateRegion(MethodView):
    @jwt_required()
    def put(self, region_slug):
        """
        Edit a region.
        @param region_slug: Slug of the region to update.
        """
        region_data = parser.parse(region_args, request)
        region: Region = Region.find_by_slug(region_slug)

        region.description = region_data['description']
        region.rules = region_data['rules']
        db.session.add(region)
        db.session.commit()

        return crag_schema.dump(region), 200


class GetRegionGrades(MethodView):

    def get(self, region_slug):
        """
        Returns the grades of all lines of a region.
        """
        region_id = Region.get_id_by_slug(region_slug)
        result = db.session.query(Line.grade_name, Line.grade_scale).join(Area).join(Sector).join(Crag).filter(
            Crag.region_id == region_id).all()
        return jsonify([{'gradeName': r[0], 'gradeScale': r[1]} for r in result]), 200
