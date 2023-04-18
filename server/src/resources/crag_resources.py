from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.crag_schema import crag_schema, crags_schema
from models.crag import Crag
from models.user import User
from webargs_schemas.crag_args import crag_args


class GetCrags(MethodView):

    def get(self):
        """
        Returns all crags.
        """
        crags: Crag = Crag.return_all()
        return jsonify(crags_schema.dump(crags)), 200


class GetCrag(MethodView):
    def get(self, id):
        """
        Returns a detailed crag.
        @param id: ID of the crag to return.
        """
        crag: Crag = Crag.find_by_id(id=id)
        return crag_schema.dump(crag), 200


class CreateCrag(MethodView):
    @jwt_required()
    def post(self, region_id):
        """
        Create a crag.
        """
        crag_data = parser.parse(crag_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_crag: Crag = Crag()
        new_crag.name = crag_data['name']
        new_crag.description = crag_data['description']
        new_crag.rules = crag_data['rules']
        new_crag.region_id = region_id
        new_crag.created_by_id = created_by.id

        db.session.add(new_crag)
        db.session.commit()
        
        return crag_schema.dump(new_crag), 201
        

class UpdateCrag(MethodView):
    @jwt_required()
    def put(self, id):
        """
        Edit a crag.
        @param id: ID of the crag to update.
        """
        crag_data = parser.parse(crag_args, request)
        crag: Crag = Crag.find_by_id(id=id)

        crag.name = crag_data['name']
        crag.description = crag_data['description']
        crag.rules = crag_data['rules']
        db.session.add(crag)
        db.session.commit()

        return crag_schema.dump(crag), 200


class DeleteCrag(MethodView):
    @jwt_required()
    def delete(self, id):
        """
        Delete a crag.
        @param id: ID of the crag to delete.
        """
        crag: Crag = Crag.find_by_id(id=id)
        crag.is_deleted = True
        
        db.session.add(crag)
        db.session.commit()

        return jsonify(None), 204

