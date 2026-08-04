from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    jwt_required,
    verify_jwt_in_request,
)
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.gallery_image_schema import (
    gallery_image_schema,
    paginated_gallery_images_schema,
)
from messages.messages import ResponseMessage
from models.area import Area
from models.crag import Crag
from models.file import File
from models.gallery_image import GalleryImage
from models.line import Line
from models.rock_explorer_feature import RockExplorerFeature
from models.sector import Sector
from models.tag import Tag, get_child_tags
from models.user import User
from util.rock_explorer import (
    assert_can_view_feature,
    rock_explorer_gallery_image_ids_subquery,
)
from util.secret_service import SecretService
from util.security_util import current_user_is_member
from util.tag_object_prefetch import prefetch_tag_objects
from util.tags import set_tags
from webargs_schemas.gallery_image_args import (
    gallery_image_post_args,
    gallery_image_put_args,
)


def set_image_tags(image, tag_data):
    set_tags(image, tag_data, attribute="tags")


def _assert_can_view_rock_explorer_tag_targets(tag_data, user) -> None:
    """Reject gallery tags pointing at drafts the caller cannot view (T-10-05)."""
    for tag in tag_data or []:
        if tag.get("objectType") != "RockExplorerFeature":
            continue
        feature = RockExplorerFeature.find_by_id(tag["objectId"])
        assert_can_view_feature(feature, user)


class GetGalleryImages(MethodView):

    def get(self):
        verify_jwt_in_request(optional=True)

        tag_object_type = request.args.get("tag-object-type")
        tag_object_slug = request.args.get("tag-object-slug")
        page = request.args.get("page") or 1
        per_page = request.args.get("per_page") or 10

        tag_object_id = None
        if tag_object_type == "RockExplorerFeature":
            if not current_user_is_member():
                raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)
            tag_object_id = request.args.get("tag-object-id")
            if not tag_object_id:
                raise BadRequest("tag-object-id is required for rock explorer tag listings.")
            feature = RockExplorerFeature.find_by_id(tag_object_id)
            assert_can_view_feature(feature, User.find_by_email(get_jwt_identity()))
        elif tag_object_type and tag_object_slug:
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

        if tag_object_id is not None:
            # Get the tag and all child tags (even if the parent tag does not actually exist yet)
            tag = Tag.query.filter_by(object_type=tag_object_type, object_id=tag_object_id).first()
            tags = get_child_tags(tag_object_type, tag_object_id)
            if tag:
                tags.append(tag)

            # Get all images that have at least one of the tags
            images_query = (
                select(GalleryImage)
                .join(GalleryImage.tags)
                .filter(GalleryImage.tags.any(Tag.id.in_([t.id for t in tags])))
                .order_by(GalleryImage.time_created.desc())
                .distinct()
            )
        else:
            images_query = (
                select(GalleryImage).join(GalleryImage.tags).order_by(GalleryImage.time_created.desc()).distinct()
            )

        if not SecretService.can_view_secrets():
            secret_images_subquery = SecretService.secret_gallery_image_ids_subquery()
            images_query = images_query.filter(~GalleryImage.id.in_(secret_images_subquery))

        if not current_user_is_member():
            images_query = images_query.filter(~GalleryImage.id.in_(rock_explorer_gallery_image_ids_subquery()))

        images_query = images_query.options(
            joinedload(GalleryImage.file),
            joinedload(GalleryImage.created_by),
            selectinload(GalleryImage.tags),
        )

        paginated_images = db.paginate(images_query, page=int(page), per_page=int(per_page))
        all_tags = [tag for image in paginated_images.items for tag in image.tags]
        prefetch_tag_objects(all_tags)
        return jsonify(paginated_gallery_images_schema.dump(paginated_images)), 200


class CreateGalleryImage(MethodView):

    @jwt_required()
    def post(self):
        gallery_image_data = parser.parse(gallery_image_post_args, request)
        created_by = User.find_by_email(get_jwt_identity())
        _assert_can_view_rock_explorer_tag_targets(gallery_image_data["tags"], created_by)
        image = GalleryImage()
        image.created_by = created_by
        image.file_id = gallery_image_data["fileId"]
        image.description = gallery_image_data.get("description") or None
        # Seed editable GPS from upload EXIF when present.
        file_row = File.find_by_id(gallery_image_data["fileId"])
        if file_row is not None:
            image.lat = file_row.exif_lat
            image.lng = file_row.exif_lng
        set_image_tags(image, gallery_image_data["tags"])

        db.session.add(image)
        db.session.commit()

        return jsonify(gallery_image_schema.dump(image)), 201


class UpdateGalleryImage(MethodView):

    @jwt_required()
    def put(self, image_id):
        image = GalleryImage.find_by_id(image_id)
        image_data = parser.parse(gallery_image_put_args, request)

        user = User.find_by_email(get_jwt_identity())
        is_owner = image.created_by_id == user.id
        is_moderator = get_jwt()["moderator"]

        if not is_owner and not is_moderator:
            raise Unauthorized("You are not allowed to update this image.")

        _assert_can_view_rock_explorer_tag_targets(image_data["tags"], user)
        set_image_tags(image, image_data["tags"])

        image.description = image_data["description"] or None

        lat = image_data["lat"]
        lng = image_data["lng"]
        if (lat is None) != (lng is None):
            raise BadRequest("lat and lng must both be set or both be null.")
        image.lat = lat
        image.lng = lng

        db.session.add(image)
        db.session.commit()
        db.session.refresh(image)

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
