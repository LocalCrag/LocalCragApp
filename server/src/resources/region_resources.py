from collections import Counter, defaultdict

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.crag_schema import crag_schema
from marshmallow_schemas.region_schema import region_schema
from models.area import Area
from models.crag import Crag
from models.enums.line_type_enum import LineTypeEnum
from models.instance_settings import InstanceSettings
from models.line import Line
from models.region import Region
from models.sector import Sector
from util.bucket_placeholders import add_bucket_placeholders
from util.secret_spots_auth import get_show_secret
from util.security_util import check_auth_claims
from webargs_schemas.region_args import region_args


class GetRegion(MethodView):
    def get(self):
        """
        Returns a detailed region.
        """
        region: Region = Region.return_it()
        return region_schema.dump(region), 200


class UpdateRegion(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self):
        """
        Edit a region.
        """
        region_data = parser.parse(region_args, request)
        region: Region = Region.return_it()

        region.name = region_data["name"].strip()
        region.description = add_bucket_placeholders(region_data["description"])
        region.rules = add_bucket_placeholders(region_data["rules"])
        db.session.add(region)
        db.session.commit()

        return crag_schema.dump(region), 200


class GetRegionGrades(MethodView):

    def get(self):
        """
        Returns the grades of all lines of the region.
        """
        instance_settings = InstanceSettings.return_it()
        query = (
            db.session.query(
                Line.type,
                Line.grade_scale,
                Line.user_grade_value if instance_settings.display_user_grades else Line.author_grade_value,
            )
            .join(Area)
            .join(Sector)
            .join(Crag)
            .filter(Line.archived.is_(False))
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
