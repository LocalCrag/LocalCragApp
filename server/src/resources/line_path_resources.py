from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.line_path_schema import line_path_schema
from models.line_path import LinePath
from models.user import User

from webargs_schemas.line_path_args import line_path_args


class CreateLinePath(MethodView):
    @jwt_required()
    def post(self, image_id):
        """
        Adds a line path to a topo image.
        @param image_id: ID of the topo image for which to add a line path.
        """
        line_path_data = parser.parse(line_path_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        if LinePath.exists_for_topo_image(image_id):
            raise BadRequest('The same line can only be added once for a single topo image.')

        new_line_path: LinePath = LinePath()
        new_line_path.line_id = line_path_data['line']
        new_line_path.path = line_path_data['path']
        new_line_path.topo_image_id = image_id
        new_line_path.created_by_id = created_by.id

        db.session.add(new_line_path)
        db.session.commit()

        return line_path_schema.dump(new_line_path), 201


class DeleteLinePath(MethodView):
    @jwt_required()
    def delete(self, line_path_id):
        """
        Delete a topo image.
        @param line_path_id: ID of the line_path to delete.
        """
        line_path: LinePath = LinePath.find_by_id(line_path_id)

        db.session.delete(line_path)
        db.session.commit()

        return jsonify(None), 204
