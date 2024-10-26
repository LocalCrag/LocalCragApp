from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.gallery_image_schema import (
    gallery_image_schema,
    gallery_images_schema,
)
from models.gallery_image import GalleryImage
from models.tag import Tag
from models.user import User
from webargs_schemas.gallery_image_args import gallery_image_args

# todo pagination


class GetGalleryImages(MethodView):

    def get(self):
        tag_object_type = request.args.get("tag_object_type")
        tag_object_id = request.args.get("tag_object_id")
        if tag_object_type or not tag_object_id:
            images = (
                db.session.query(GalleryImage)
                .join(GalleryImage.tags)
                .filter(Tag.object_type == tag_object_type, Tag.object_id == tag_object_id)
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
