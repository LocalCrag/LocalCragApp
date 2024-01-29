from typing import List

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.area_schema import areas_schema, area_schema
from marshmallow_schemas.line_path_schema import line_path_schema
from marshmallow_schemas.sector_schema import sectors_schema, sector_schema
from marshmallow_schemas.topo_image_schema import topo_images_schema, topo_image_schema
from models.area import Area
from models.line_path import LinePath
from models.sector import Sector
from models.topo_image import TopoImage
from models.user import User

from webargs_schemas.area_args import area_args
from webargs_schemas.line_path_args import line_path_args
from webargs_schemas.topo_image_args import topo_image_args


class AddTopoImage(MethodView):
    @jwt_required()
    def post(self, area_slug):
        """
        Adds a topo image to the area.
        """
        area_id = Area.get_id_by_slug(area_slug)
        topo_image_data = parser.parse(topo_image_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_topo_image: TopoImage = TopoImage()
        new_topo_image.file_id = topo_image_data['image']
        new_topo_image.area_id = area_id
        new_topo_image.created_by_id = created_by.id

        db.session.add(new_topo_image)
        db.session.commit()

        return topo_image_schema.dump(new_topo_image), 201


class DeleteTopoImage(MethodView):
    @jwt_required()
    def delete(self, image_id):
        """
        Delete a topo image.
        @param image_id: ID of the topo image to delete.
        """
        image: TopoImage = TopoImage.find_by_id(image_id)

        db.session.delete(image)
        db.session.commit()

        return jsonify(None), 204


class GetTopoImages(MethodView):

    def get(self, area_slug):
        """
        Returns all topo images of an area.
        """
        area_id = Area.get_id_by_slug(area_slug)
        topo_images: List[TopoImage] = TopoImage.return_all(filter=lambda: TopoImage.area_id == area_id)
        return jsonify(topo_images_schema.dump(topo_images)), 200


class CreateLinePath(MethodView):
    @jwt_required()
    def post(self, topo_image_id):
        """
        Adds a line path to a topo image.
        @param topo_image_id: ID of the topo image for which to add a line path.
        """
        line_path_data = parser.parse(line_path_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_line_path: LinePath = LinePath()
        new_line_path.line_id = line_path_data['line']
        new_line_path.path = line_path_data['path']
        new_line_path.topo_image_id = topo_image_id
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
