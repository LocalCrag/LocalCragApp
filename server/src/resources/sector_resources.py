from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.crag_schema import crag_schema, crags_schema
from marshmallow_schemas.sector_schema import sectors_schema, sector_schema
from models.crag import Crag
from models.sector import Sector
from models.user import User
from util.name_to_slug import name_to_slug
from webargs_schemas.crag_args import crag_args
from webargs_schemas.sector_args import sector_args


class GetSectors(MethodView):

    def get(self, crag_slug):
        """
        Returns all sectors of a crag.
        """
        crag_id = Crag.get_id_by_slug(crag_slug)
        sectors: Sector = Sector.return_all(filter=lambda: Sector.crag_id == crag_id,
                                            order_by=lambda: Sector.name.asc())
        return jsonify(sectors_schema.dump(sectors)), 200


class GetSector(MethodView):
    def get(self, crag_slug, sector_slug):
        """
        Returns a detailed sector.
        @param crag_slug: Slug of the crag that the sector is in.
        @param sector_slug: Slug of the sector to return.
        """
        crag_id = Crag.get_id_by_slug(crag_slug)
        sector: Sector = Sector.find_by_slug(slug=sector_slug, crag_id=crag_id)
        return sector_schema.dump(sector), 200


class CreateSector(MethodView):
    @jwt_required()
    def post(self, crag_slug):
        """
        Create a sector.
        """
        crag_id = Crag.get_id_by_slug(crag_slug)
        sector_data = parser.parse(sector_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_sector: Sector = Sector()
        new_sector.name = sector_data['name']
        new_sector.description = sector_data['description']
        new_sector.short_description = sector_data['shortDescription']
        new_sector.portrait_image_id = sector_data['portraitImage']
        new_sector.crag_id = crag_id
        new_sector.created_by_id = created_by.id
        # todo test slug for duplicates
        new_sector.slug = name_to_slug(new_sector.name)

        db.session.add(new_sector)
        db.session.commit()

        return sector_schema.dump(new_sector), 201


class UpdateSector(MethodView):
    @jwt_required()
    def put(self, id):
        """
        Edit a sector.
        @param id: ID of the sector to update.
        """
        sector_data = parser.parse(sector_args, request)
        sector: Sector = Sector.find_by_id(id=id)

        sector.name = sector_data['name']
        sector.description = sector_data['description']
        sector.short_description = sector_data['shortDescription']
        sector.portrait_image_id = sector_data['portraitImage']
        # todo test slug for duplicates
        sector.slug = name_to_slug(sector.name)
        db.session.add(sector)
        db.session.commit()

        return sector_schema.dump(sector), 200


class DeleteSector(MethodView):
    @jwt_required()
    def delete(self, id):
        """
        Delete a sector.
        @param id: ID of the sector to delete.
        """
        sector: Sector = Sector.find_by_id(id=id)

        db.session.delete(sector)
        db.session.commit()

        return jsonify(None), 204
