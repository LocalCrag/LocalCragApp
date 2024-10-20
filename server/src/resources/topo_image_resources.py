from typing import List

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.topo_image_schema import topo_image_schema, topo_images_schema
from models.area import Area
from models.topo_image import TopoImage
from models.user import User
from resources.map_resources import create_or_update_markers
from util.secret_spots_auth import get_show_secret
from util.security_util import check_auth_claims
from util.validators import validate_order_payload
from webargs_schemas.topo_image_args import topo_image_args


class AddTopoImage(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def post(self, area_slug):
        """
        Adds a topo image to the area.
        """
        area_id = Area.get_id_by_slug(area_slug)
        topo_image_data = parser.parse(topo_image_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_topo_image: TopoImage = TopoImage()
        new_topo_image.file_id = topo_image_data["image"]
        new_topo_image.title = topo_image_data["title"]
        new_topo_image.description = topo_image_data["description"]
        new_topo_image.area_id = area_id
        new_topo_image.created_by_id = created_by.id
        new_topo_image.order_index = TopoImage.find_max_order_index(area_id) + 1
        new_topo_image.map_markers = create_or_update_markers(topo_image_data["mapMarkers"], new_topo_image)
        new_topo_image.archived = topo_image_data["archived"]

        db.session.add(new_topo_image)
        db.session.commit()

        return topo_image_schema.dump(new_topo_image), 201


class UpdateTopoImage(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, image_id):
        topo_image_data = parser.parse(topo_image_args, request)
        topo_image: TopoImage = TopoImage.find_by_id(image_id)

        topo_image.title = topo_image_data["title"]
        topo_image.description = topo_image_data["description"]
        topo_image.map_markers = create_or_update_markers(topo_image_data["mapMarkers"], topo_image)
        topo_image.archived = topo_image_data["archived"]
        db.session.add(topo_image)
        db.session.commit()

        return topo_image_schema.dump(topo_image), 200


class DeleteTopoImage(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def delete(self, image_id):
        """
        Delete a topo image.
        @param image_id: ID of the topo image to delete.
        """
        image: TopoImage = TopoImage.find_by_id(image_id)

        db.session.delete(image)
        query = text(
            "UPDATE topo_images SET order_index=order_index - 1 WHERE "
            "order_index > :order_index AND area_id = :area_id"
        )
        db.session.execute(query, {"order_index": image.order_index, "area_id": image.area_id})
        db.session.commit()

        return jsonify(None), 204


class GetTopoImages(MethodView):

    def get(self, area_slug):
        """
        Returns all topo images of an area.
        """
        archived = request.args.get("archived", False, type=bool)  # default: hide archived topo images

        area_id = Area.get_id_by_slug(area_slug)
        topo_images: List[TopoImage] = TopoImage.return_all(
            filter=lambda: [TopoImage.archived == archived, TopoImage.area_id == area_id], order_by=lambda: TopoImage.order_index.asc()
        )
        include_secret = True
        if not get_show_secret():
            include_secret = False
        unfiltered_response = topo_images_schema.dump(topo_images)
        if not include_secret:
            for ti in unfiltered_response:
                ti["linePaths"] = [lp for lp in ti["linePaths"] if not lp["line"]["secret"]]
        return jsonify(unfiltered_response), 200


class GetTopoImage(MethodView):
    def get(self, image_id):
        """
        Returns a detailed topo image.
        @param image_id: ID of the topo image to return.
        """
        topo_image: TopoImage = TopoImage.find_by_id(image_id)
        return topo_image_schema.dump(topo_image), 200


class UpdateTopoImageOrder(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, area_slug):
        """
        Changes the order index of topo images.
        """
        new_order = request.json
        area_id = Area.get_id_by_slug(area_slug)
        topo_images: List[TopoImage] = TopoImage.return_all(filter=lambda: TopoImage.area_id == area_id)

        if not validate_order_payload(new_order, topo_images):
            raise BadRequest("New order doesn't match the requirements of the data to order.")

        for topo_image in topo_images:
            topo_image.order_index = new_order[str(topo_image.id)]
            db.session.add(topo_image)

        db.session.commit()

        return jsonify(None), 200
