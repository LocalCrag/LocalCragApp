from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from webargs.flaskparser import parser

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
from models.tag import Tag
from models.user import User
from webargs_schemas.gallery_image_args import gallery_image_args

# todo tests
# todo pagination


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
            if tag_object_model == "Area":
                tag_object_model = Area
            if tag_object_model == "Sector":
                tag_object_model = Sector
            if tag_object_model == "Crag":
                tag_object_model = Crag
            tag_object_id = tag_object_model.get_id_by_slug(tag_object_slug)
            # Get the images for the object
            images = (
                db.session.query(GalleryImage)
                .join(GalleryImage.tags)
                .filter(Tag.object_type == tag_object_type, Tag.object_id == tag_object_id)
                .all()
            )
            # todo also show for parents
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


# todo delete, by owner or admins
