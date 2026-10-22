from typing import List

from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy import text
from sqlalchemy.orm import joinedload, selectinload
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.search_schema import topo_image_search_schema
from marshmallow_schemas.topo_image_schema import topo_image_schema, topo_images_schema
from messages.messages import ResponseMessage
from models.area import Area
from models.enums.publication_status_enum import PublicationStatusEnum
from models.line import Line
from models.line_path import LinePath
from models.topo_image import TopoImage
from resources.map_resources import create_or_update_markers
from util.auth_session import (
    get_current_user,
    session_required,
)
from util.html_inline_styles import sanitize_wysiwyg_html
from util.propagating_boolean_attrs import update_line_propagating_boolean_attr
from util.secret_service import SecretService
from util.suggestions import (
    assert_can_delete_publication,
    assert_can_view_publication,
    can_edit_publication,
    delete_topo_image,
    line_path_listed,
    notify_moderators_of_submission,
    optional_request_user,
    publication_visibility_clause,
    require_suggest_or_moderator,
)
from util.validators import validate_order_payload
from webargs_schemas.move_args import move_topo_image_args
from webargs_schemas.topo_image_args import topo_image_args


class AddTopoImage(MethodView):
    @session_required()
    def post(self, area_slug):
        """
        Adds a topo image to the area. Non-moderators create a draft when suggestions are enabled.
        """
        actor = get_current_user()
        require_suggest_or_moderator(actor)
        area_id = Area.get_id_by_slug(area_slug)
        topo_image_data = parser.parse(topo_image_args, request)

        new_topo_image: TopoImage = TopoImage()
        new_topo_image.file_id = topo_image_data["image"]
        new_topo_image.title = topo_image_data["title"]
        new_topo_image.description = sanitize_wysiwyg_html(topo_image_data["description"])
        new_topo_image.area_id = area_id
        new_topo_image.order_index = TopoImage.find_max_order_index(area_id) + 1
        new_topo_image.publication_status = (
            PublicationStatusEnum.PUBLISHED if actor.moderator else PublicationStatusEnum.DRAFT
        )
        new_topo_image.map_markers = create_or_update_markers(topo_image_data["mapMarkers"], new_topo_image)

        db.session.add(new_topo_image)
        if new_topo_image.publication_status == PublicationStatusEnum.DRAFT:
            db.session.flush()
            notify_moderators_of_submission(actor, "topo_image", new_topo_image.id)
        db.session.commit()

        return topo_image_schema.dump(new_topo_image), 201


class UpdateTopoImage(MethodView):
    @session_required()
    def put(self, image_id):
        topo_image_data = parser.parse(topo_image_args, request)
        topo_image: TopoImage = TopoImage.find_by_id(image_id)
        actor = get_current_user()
        if not can_edit_publication(actor, topo_image):
            raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)

        topo_image.title = topo_image_data["title"]
        topo_image.description = sanitize_wysiwyg_html(topo_image_data["description"])
        topo_image.map_markers = create_or_update_markers(topo_image_data["mapMarkers"], topo_image)
        db.session.add(topo_image)
        db.session.commit()

        return topo_image_schema.dump(topo_image), 200


class MoveTopoImage(MethodView):
    @session_required(moderator=True)
    def put(self, image_id):
        """Move a topo image to a different area.

        - Moves the topo image to the target area (appends at end).
        - Moves all lines connected via line paths of this topo image to the target area.
        - Deletes any line paths for those moved lines that still belong to topo images in the *old* area.
        """
        payload = parser.parse(move_topo_image_args, request)
        target_area_id = payload["areaId"]

        topo_image: TopoImage = TopoImage.find_by_id(image_id)
        old_area_id = topo_image.area_id
        target_area_id = Area.find_by_id(target_area_id).id

        if target_area_id == old_area_id:
            return topo_image_schema.dump(topo_image), 200

        # Determine affected line ids (lines connected to this topo image)
        affected_line_ids = [lp.line_id for lp in topo_image.line_paths]

        # Close the ordering gap in old area
        db.session.execute(
            text(
                "UPDATE topo_images SET order_index=order_index - 1 "
                "WHERE order_index > :order_index AND area_id = :area_id"
            ),
            {"order_index": topo_image.order_index, "area_id": old_area_id},
        )

        # Move topo image (append to end in new area)
        topo_image.area_id = target_area_id
        topo_image.order_index = TopoImage.find_max_order_index(target_area_id) + 1
        db.session.add(topo_image)

        # Move connected lines to target area
        if affected_line_ids:
            Line.query.filter(Line.id.in_(affected_line_ids)).update(
                {Line.area_id: target_area_id},
                synchronize_session=False,
            )

            # If the target area is secret or closed, each moved line must match.
            target_area = Area.find_by_id(target_area_id)
            if target_area.secret or target_area.closed:
                moved_lines = Line.query.filter(Line.id.in_(affected_line_ids)).all()
                for line in moved_lines:
                    if target_area.secret and not line.secret:
                        update_line_propagating_boolean_attr(line, True, "secret")
                    if target_area.closed and not line.closed:
                        update_line_propagating_boolean_attr(line, True, "closed")

                    db.session.add(line)

            # Delete line paths for moved lines that still point to topo images in the old area
            # (i.e. the topo_image referenced by the line path still belongs to old_area_id).
            (
                db.session.query(LinePath)
                .filter(LinePath.line_id.in_(affected_line_ids))
                .filter(LinePath.topo_image.has(TopoImage.area_id == old_area_id))
                .delete(synchronize_session=False)
            )

        db.session.commit()
        return topo_image_search_schema.dump(topo_image), 200


class DeleteTopoImage(MethodView):
    @session_required()
    def delete(self, image_id):
        """
        Delete a topo image.
        @param image_id: ID of the topo image to delete.
        """
        image: TopoImage = TopoImage.find_by_id(image_id)
        assert_can_delete_publication(get_current_user(), image)

        delete_topo_image(image)
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
        viewer = optional_request_user()
        status_filter = (
            TopoImage.publication_status == PublicationStatusEnum.ARCHIVED
            if archived
            else publication_visibility_clause(TopoImage, viewer)
        )
        topo_images: List[TopoImage] = TopoImage.return_all(
            filter=lambda: [
                status_filter,
                TopoImage.area_id == area_id,
            ],
            order_by=lambda: TopoImage.order_index.asc(),
            options=(
                joinedload(TopoImage.file),
                selectinload(TopoImage.line_paths).joinedload(LinePath.line),
                selectinload(TopoImage.map_markers),
            ),
        )
        lines = [line_path.line for topo_image in topo_images for line_path in topo_image.line_paths]
        SecretService.attach_secret_flags(lines)
        include_secret = True
        if not SecretService.can_view_secrets():
            include_secret = False
        unfiltered_response = topo_images_schema.dump(topo_images)
        if not include_secret:
            for ti in unfiltered_response:
                ti["linePaths"] = [lp for lp in ti["linePaths"] if not lp["line"]["secret"]]
        for ti in unfiltered_response:
            ti["linePaths"] = [
                lp for lp in ti["linePaths"] if line_path_listed(ti.get("publicationStatus"), lp["line"], viewer)
            ]

        return jsonify(unfiltered_response), 200


class GetTopoImage(MethodView):
    def get(self, image_id):
        """
        Returns a detailed topo image.
        @param image_id: ID of the topo image to return.
        """
        topo_image: TopoImage = TopoImage.find_by_id(image_id)
        viewer = optional_request_user()
        assert_can_view_publication(topo_image, viewer)
        payload = topo_image_schema.dump(topo_image)
        payload["linePaths"] = [
            lp for lp in payload["linePaths"] if line_path_listed(payload.get("publicationStatus"), lp["line"], viewer)
        ]
        return payload, 200


class UpdateTopoImageOrder(MethodView):
    @session_required(moderator=True)
    def put(self, area_slug):
        """
        Changes the order index of topo images. Only works on unarchived topo images.
        """
        new_order = request.json
        area_id = Area.get_id_by_slug(area_slug)
        topo_images: List[TopoImage] = TopoImage.return_all(
            filter=lambda: [
                TopoImage.area_id == area_id,
                TopoImage.publication_status != PublicationStatusEnum.ARCHIVED,
            ]
        )

        if not validate_order_payload(new_order, topo_images):
            raise BadRequest("New order doesn't match the requirements of the data to order.")

        for topo_image in topo_images:
            topo_image.order_index = new_order[str(topo_image.id)]
            db.session.add(topo_image)

        db.session.commit()

        return jsonify(None), 200
