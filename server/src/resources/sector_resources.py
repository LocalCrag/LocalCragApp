from typing import List

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.crag_schema import crag_schema, crags_schema
from marshmallow_schemas.sector_schema import sectors_schema, sector_schema
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from models.user import User
from util.bucket_placeholders import add_bucket_placeholders
from util.secret_spots import update_sector_secret_property, set_sector_parents_unsecret
from util.security_util import check_auth_claims, check_secret_spot_permission
from util.validators import validate_order_payload
from webargs_schemas.crag_args import crag_args
from webargs_schemas.sector_args import sector_args


class GetSectors(MethodView):

    def get(self, crag_slug):
        """
        Returns all sectors of a crag.
        """
        crag_id = Crag.get_id_by_slug(crag_slug)
        sectors: Sector = Sector.return_all(filter=lambda: Sector.crag_id == crag_id,
                                            order_by=lambda: Sector.order_index.asc())
        return jsonify(sectors_schema.dump(sectors)), 200


class GetSector(MethodView):
    def get(self, sector_slug):
        """
        Returns a detailed sector.
        @param sector_slug: Slug of the sector to return.
        """
        sector: Sector = Sector.find_by_slug(sector_slug)
        check_secret_spot_permission(sector)
        return sector_schema.dump(sector), 200


class CreateSector(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def post(self, crag_slug):
        """
        Create a sector.
        """
        crag_id = Crag.get_id_by_slug(crag_slug)
        sector_data = parser.parse(sector_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_sector: Sector = Sector()
        new_sector.name = sector_data['name']
        new_sector.description = add_bucket_placeholders(sector_data['description'])
        new_sector.short_description = sector_data['shortDescription']
        new_sector.portrait_image_id = sector_data['portraitImage']
        new_sector.lat = sector_data['lat']
        new_sector.lng = sector_data['lng']
        new_sector.rules = add_bucket_placeholders(sector_data['rules'])
        new_sector.crag_id = crag_id
        new_sector.created_by_id = created_by.id
        new_sector.order_index = Sector.find_max_order_index(crag_id) + 1
        new_sector.secret = sector_data['secret']

        set_sector_parents_unsecret(new_sector)
        db.session.add(new_sector)
        db.session.commit()


        return sector_schema.dump(new_sector), 201


class UpdateSector(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, sector_slug):
        """
        Edit a sector.
        @param sector_slug: Slug of the sector to update.
        """
        sector_data = parser.parse(sector_args, request)
        sector: Sector = Sector.find_by_slug(sector_slug)

        sector.name = sector_data['name']
        sector.description = add_bucket_placeholders(sector_data['description'])
        sector.short_description = sector_data['shortDescription']
        sector.portrait_image_id = sector_data['portraitImage']
        sector.lat = sector_data['lat']
        sector.lng = sector_data['lng']
        sector.rules = add_bucket_placeholders(sector_data['rules'])
        update_sector_secret_property(sector, sector_data['secret'])
        db.session.add(sector)
        db.session.commit()

        return sector_schema.dump(sector), 200


class DeleteSector(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def delete(self, sector_slug):
        """
        Delete a sector.
        @param sector_slug: Slug of the sector to delete.
        """
        sector: Sector = Sector.find_by_slug(sector_slug)

        db.session.delete(sector)
        query = text("UPDATE sectors SET order_index=order_index - 1 WHERE order_index > :order_index AND crag_id = :crag_id")
        db.session.execute(query, {'order_index': sector.order_index, 'crag_id': sector.crag_id})
        db.session.commit()

        return jsonify(None), 204


class UpdateSectorOrder(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, crag_slug):
        """
        Changes the order index of sectors.
        """
        new_order = request.json
        crag_id = Crag.get_id_by_slug(crag_slug)
        sectors: List[Sector] = Sector.return_all(filter=lambda: Sector.crag_id == crag_id)

        if not validate_order_payload(new_order, sectors):
            raise BadRequest('New order doesn\'t match the requirements of the data to order.')

        for sector in sectors:
            sector.order_index = new_order[str(sector.id)]
            db.session.add(sector)

        db.session.commit()

        return jsonify(None), 200


class GetSectorGrades(MethodView):

    def get(self, sector_slug):
        """
        Returns the grades of all lines of a sector.
        """
        sector_id = Sector.get_id_by_slug(sector_slug)
        result = db.session.query(Line.grade_name, Line.grade_scale).join(Area).filter(Area.sector_id == sector_id).all()
        return jsonify([{'gradeName': r[0], 'gradeScale': r[1]} for r in result]), 200