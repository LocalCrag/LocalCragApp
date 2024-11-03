from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.gallery_image_schema import (
    gallery_image_schema,
    gallery_images_schema,
)
from models.area import Area
from models.crag import Crag
from models.enums.tag_object_type_enum import TagObjectTypeEnum
from models.gallery_image import GalleryImage
from models.line import Line
from models.sector import Sector
from models.tag import Tag, get_child_tags
from models.user import User
from webargs_schemas.gallery_image_args import gallery_image_args


class GetGalleryImages(MethodView):

    def get(self):
        tag_object_type_str = request.args.get("tag-object-type")
        tag_object_type = next((e for e in TagObjectTypeEnum if e.value == tag_object_type_str), None)
        tag_object_slug = request.args.get("tag-object-slug")
        if tag_object_type and tag_object_slug:
            # Get the object_id for the slug based on object type
            tag_object_model = None
            if tag_object_type == TagObjectTypeEnum.LINE:
                tag_object_model = Line
            if tag_object_type == TagObjectTypeEnum.USER:
                tag_object_model = User
            if tag_object_type == TagObjectTypeEnum.AREA:
                tag_object_model = Area
            if tag_object_type == TagObjectTypeEnum.SECTOR:
                tag_object_model = Sector
            if tag_object_type == TagObjectTypeEnum.CRAG:
                tag_object_model = Crag
            tag_object_id = tag_object_model.get_id_by_slug(tag_object_slug)
            # Get the images for the object
            tag = Tag.query.filter_by(object_type=tag_object_type, object_id=tag_object_id).first()

            # If the tag does not exist yet, gallery must be empty, return an empty list
            if not tag:
                return jsonify([]), 200

            tags = [tag] + get_child_tags(tag)
            images = (
                db.session.query(GalleryImage)
                .join(GalleryImage.tags)
                .filter(GalleryImage.tags.any(Tag.id.in_([t.id for t in tags])))
                .order_by(GalleryImage.time_created.desc())
                .all()
            )
        else:
            images = GalleryImage.return_all(order_by=lambda: GalleryImage.time_created.desc())
        return jsonify(gallery_images_schema.dump(images)), 200


class CreateGalleryImage(MethodView):

    @jwt_required()
    def post(self):
        gallery_image_data = parser.parse(gallery_image_args, request)
        created_by = User.find_by_email(get_jwt_identity())
        image = GalleryImage()
        image.created_by = created_by
        image.file_id = gallery_image_data["fileId"]

        for tag_data in gallery_image_data["tags"]:
            tag = Tag.query.filter_by(object_type=tag_data["objectType"], object_id=tag_data["objectId"]).first()
            if not tag:
                tag = Tag()
                tag.object_type = tag_data["objectType"]
                tag.object_id = tag_data["objectId"]
            image.tags.append(tag)

        db.session.add(image)
        db.session.commit()

        return jsonify(gallery_image_schema.dump(image)), 201


class UpdateGalleryImage(MethodView):

    @jwt_required()
    def put(self, image_id):
        image = GalleryImage.find_by_id(image_id)
        image_data = parser.parse(gallery_image_args, request)

        is_owner = image.created_by_id == User.find_by_email(get_jwt_identity()).id
        is_moderator = get_jwt()["moderator"]

        if not is_owner and not is_moderator:
            raise Unauthorized("You are not allowed to update this image.")

        image.tags = []
        for tag_data in image_data["tags"]:
            tag = Tag.query.filter_by(object_type=tag_data["objectType"], object_id=tag_data["objectId"]).first()
            if not tag:
                tag = Tag()
                tag.object_type = tag_data["objectType"]
                tag.object_id = tag_data["objectId"]
            image.tags.append(tag)

        db.session.add(image)
        db.session.commit()

        return jsonify(gallery_image_schema.dump(image)), 200


class DeleteGalleryImage(MethodView):

    @jwt_required()
    def delete(self, image_id):
        image = GalleryImage.find_by_id(image_id)

        is_owner = image.created_by_id == User.find_by_email(get_jwt_identity()).id
        is_moderator = get_jwt()["moderator"]

        if not is_owner and not is_moderator:
            raise Unauthorized("You are not allowed to delete this image.")

        db.session.delete(image)
        db.session.commit()
        return jsonify(None), 204
