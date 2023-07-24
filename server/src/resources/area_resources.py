from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.area_schema import areas_schema, area_schema
from marshmallow_schemas.sector_schema import sectors_schema, sector_schema
from models.area import Area
from models.sector import Sector
from models.user import User

from webargs_schemas.area_args import area_args


class GetAreas(MethodView):

    def get(self, sector_slug):
        """
        Returns all areas of a sector.
        """
        sector_id = Sector.get_id_by_slug(sector_slug)
        areas: Area = Area.return_all(filter=lambda: Area.sector_id == sector_id,
                                      order_by=lambda: Area.name.asc())
        return jsonify(areas_schema.dump(areas)), 200


class GetArea(MethodView):
    def get(self, area_slug):
        """
        Returns a detailed area.
        @param area_slug: Slug of the area to return.
        """
        area: Area = Area.find_by_slug(area_slug)
        return sector_schema.dump(area), 200


class CreateArea(MethodView):
    @jwt_required()
    def post(self, sector_slug):
        """
        Creates an area.
        """
        sector_id = Sector.get_id_by_slug(sector_slug)
        area_data = parser.parse(area_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_area: Area = Area()
        new_area.name = area_data['name']
        new_area.lat = area_data['lat']
        new_area.lng = area_data['lng']
        new_area.description = area_data['description']
        new_area.portrait_image_id = area_data['portraitImage']
        new_area.sector_id = sector_id
        new_area.created_by_id = created_by.id

        db.session.add(new_area)
        db.session.commit()

        return area_schema.dump(new_area), 201


class UpdateArea(MethodView):
    @jwt_required()
    def put(self, id):
        """
        Edit an area.
        @param id: ID of the area to update.
        """
        area_data = parser.parse(area_args, request)
        area: Area = Area.find_by_id(id=id)

        area.name = area_data['name']
        area.lat = area_data['lat']
        area.lng = area_data['lng']
        area.description = area_data['description']
        area.portrait_image_id = area_data['portraitImage']
        db.session.add(area)
        db.session.commit()

        return area_schema.dump(area), 200


class DeleteArea(MethodView):
    @jwt_required()
    def delete(self, id):
        """
        Delete an area.
        @param id: ID of the area to delete.
        """
        area: Area = Area.find_by_id(id=id)

        db.session.delete(area)
        db.session.commit()

        return jsonify(None), 204
