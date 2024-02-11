from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.crag_schema import crag_schema, crags_schema
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.region import Region
from models.sector import Sector
from models.user import User
from util.validators import validate_order_payload
from webargs_schemas.crag_args import crag_args


class GetCrags(MethodView):

    def get(self, region_slug):
        """
        Returns all crags.
        @param region_slug: Slug of the region to return the crags for.
        """
        region_id = Region.get_id_by_slug(region_slug)
        crags: Crag = Crag.return_all(filter=lambda: Crag.region_id == region_id,
                                      order_by=lambda: Crag.order_index.asc())
        return jsonify(crags_schema.dump(crags)), 200


class GetCrag(MethodView):
    def get(self, crag_slug):
        """
        Returns a detailed crag.
        @param crag_slug: Slug of the crag to return.
        """
        crag: Crag = Crag.find_by_slug(slug=crag_slug)
        return crag_schema.dump(crag), 200


class CreateCrag(MethodView):
    @jwt_required()
    def post(self, region_slug):
        """
        Create a crag.
        """
        crag_data = parser.parse(crag_args, request)
        created_by = User.find_by_email(get_jwt_identity())
        region_id = Region.get_id_by_slug(region_slug)

        new_crag: Crag = Crag()
        new_crag.name = crag_data['name']
        new_crag.description = crag_data['description']
        new_crag.short_description = crag_data['shortDescription']
        new_crag.rules = crag_data['rules']
        new_crag.portrait_image_id = crag_data['portraitImage']
        new_crag.region_id = region_id
        new_crag.created_by_id = created_by.id
        new_crag.order_index = Crag.find_max_order_index() + 1

        db.session.add(new_crag)
        db.session.commit()

        return crag_schema.dump(new_crag), 201


class UpdateCrag(MethodView):
    @jwt_required()
    def put(self, crag_slug):
        """
        Edit a crag.
        @param crag_slug: Slug of the crag to update.
        """
        crag_data = parser.parse(crag_args, request)
        crag: Crag = Crag.find_by_slug(crag_slug)

        crag.name = crag_data['name']
        crag.description = crag_data['description']
        crag.short_description = crag_data['shortDescription']
        crag.rules = crag_data['rules']
        crag.portrait_image_id = crag_data['portraitImage']
        db.session.add(crag)
        db.session.commit()

        return crag_schema.dump(crag), 200


class DeleteCrag(MethodView):
    @jwt_required()
    def delete(self, crag_slug):
        """
        Delete a crag.
        @param crag_slug: Slug of the crag to delete.
        """
        crag: Crag = Crag.find_by_slug(crag_slug)

        db.session.delete(crag)
        db.session.execute(text(
            "UPDATE crags SET order_index=order_index - 1 WHERE order_index > {}".format(crag.order_index)))
        db.session.commit()

        return jsonify(None), 204


class UpdateCragOrder(MethodView):
    @jwt_required()
    def put(self):
        """
        Changes the order index of crags.
        """
        new_order = request.json
        crags = Crag.return_all()

        if not validate_order_payload(new_order, crags):
            raise BadRequest('New order doesn\'t match the requirements of the data to order.')

        for crag in crags:
            crag.order_index = new_order[str(crag.id)]
            db.session.add(crag)

        db.session.commit()

        return jsonify(None), 200


class GetCragGrades(MethodView):

    def get(self, crag_slug):
        """
        Returns the grades of all lines of a crag.
        """
        crag_id = Crag.get_id_by_slug(crag_slug)
        result = db.session.query(Line.grade_name, Line.grade_scale).join(Area).join(Sector).filter(
            Sector.crag_id == crag_id).all()
        return jsonify([{'gradeName': r[0], 'gradeScale': r[1]} for r in result]), 200
