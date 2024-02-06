from typing import List

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.topo_image_schema import topo_images_schema, topo_image_schema
from models.area import Area
from models.topo_image import TopoImage
from models.user import User

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
        new_topo_image.order_index = TopoImage.find_max_order_index(area_id) + 1

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
        db.session.execute(text(
            "UPDATE topo_images SET order_index=order_index - 1 WHERE order_index > {} AND area_id = {}}".format(
                image.order_index, image.area_id)))
        db.session.commit()

        return jsonify(None), 204


class GetTopoImages(MethodView):

    def get(self, area_slug):
        """
        Returns all topo images of an area.
        """
        area_id = Area.get_id_by_slug(area_slug)
        topo_images: List[TopoImage] = TopoImage.return_all(filter=lambda: TopoImage.area_id == area_id,
                                                            order_by=lambda: TopoImage.order_index.asc())
        return jsonify(topo_images_schema.dump(topo_images)), 200


class GetTopoImage(MethodView):
    def get(self, image_id):
        """
        Returns a detailed topo image.
        @param image_id: ID of the topo image to return.
        """
        topo_image: TopoImage = TopoImage.find_by_id(image_id)
        return topo_image_schema.dump(topo_image), 200
