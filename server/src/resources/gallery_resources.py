from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.not_found import NotFound
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.gallery_image_schema import (
    gallery_image_schema,
    gallery_images_schema,
)
from models.area import Area
from models.crag import Crag
from models.gallery_image import GalleryImage
from models.line import Line
from models.sector import Sector
from models.tag import Tag, get_child_tags
from models.user import User
from util.generic_relationships import check_object_exists
from webargs_schemas.gallery_image_args import (
    gallery_image_post_args,
    gallery_image_put_args,
)


class GetGalleryImages(MethodView):

    def get(self):
        tag_object_type = request.args.get("tag-object-type")
        tag_object_slug = request.args.get("tag-object-slug")
        if tag_object_type and tag_object_slug:
            # Get the object_id for the slug based on object type
            tag_object_model = None
            if tag_object_type == "Line":
                tag_object_model = Line
            if tag_object_type == "User":
                tag_object_model = User
            if tag_object_type == "Area":
                tag_object_model = Area
            if tag_object_type == "Sector":
                tag_object_model = Sector
            if tag_object_type == "Crag":
                tag_object_model = Crag
            tag_object_id = tag_object_model.get_id_by_slug(tag_object_slug)

            # Get the tag and all child tags (even if the parent tag does not actually exist yet)
            tag = Tag.query.filter_by(object_type=tag_object_type, object_id=tag_object_id).first()
            tags = get_child_tags(tag_object_type, tag_object_id)
            if tag:
                tags.append(tag)

            # Get all images that have at least one of the tags
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


def set_image_tags(image, tag_data):
    image.tags = []
    for tag_data in tag_data:
        tag = Tag.query.filter_by(object_type=tag_data["objectType"], object_id=tag_data["objectId"]).first()
        if not tag:
            tag = Tag()
            tag.object_type = tag_data["objectType"]
            tag.object_id = tag_data["objectId"]
            if not check_object_exists(tag.object_type, tag.object_id):
                raise NotFound(f"{tag.object_type} with id {tag.object_id} does not exist.")
        image.tags.append(tag)


class CreateGalleryImage(MethodView):

    @jwt_required()
    def post(self):
        gallery_image_data = parser.parse(gallery_image_post_args, request)
        created_by = User.find_by_email(get_jwt_identity())
        image = GalleryImage()
        image.created_by = created_by
        image.file_id = gallery_image_data["fileId"]
        set_image_tags(image, gallery_image_data["tags"])

        db.session.add(image)
        db.session.commit()

        return jsonify(gallery_image_schema.dump(image)), 201


class UpdateGalleryImage(MethodView):

    @jwt_required()
    def put(self, image_id):
        image = GalleryImage.find_by_id(image_id)
        image_data = parser.parse(gallery_image_put_args, request)

        is_owner = image.created_by_id == User.find_by_email(get_jwt_identity()).id
        is_moderator = get_jwt()["moderator"]

        if not is_owner and not is_moderator:
            raise Unauthorized("You are not allowed to update this image.")

        set_image_tags(image, image_data["tags"])

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
