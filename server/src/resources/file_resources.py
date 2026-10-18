from flask import request
from flask.views import MethodView
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.forbidden import Forbidden
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from marshmallow_schemas.file_schema import file_schema
from messages.messages import ResponseMessage
from models.file import File
from models.user import User
from uploader.errors import InvalidImageTransform
from uploader.media_upload_handler import transform_stored_image
from util.auth_session import get_current_user, session_required
from webargs_schemas.file_args import file_focus_args, file_transform_args


class UpdateFile(MethodView):
    @session_required(moderator=True)
    def patch(self, file_id):
        """
        Updates vertical focus metadata for an uploaded file.
        """
        file = File.query.get(file_id)
        if not file:
            raise NotFound()

        focus_data = parser.parse(file_focus_args, request)
        file.focus_y = focus_data["focusY"]
        db.session.commit()

        return file_schema.dump(file)


def user_can_transform_file(user: User, source: File) -> bool:
    """Moderators may edit any file. Everyone else may edit only files they uploaded.

    Admins and the superadmin are also moderators. A file with no creator (older rows,
    or rows inserted outside a request) is staff-only.
    """
    if user.moderator or user.admin or user.superadmin:
        return True
    return source.created_by_id is not None and source.created_by_id == user.id


class TransformFile(MethodView):
    @session_required()
    def post(self, file_id):
        """
        Stores a rotated and cropped copy of an uploaded image.
        The source file is left unchanged.
        """
        source = File.query.get(file_id)
        if not source:
            raise NotFound()

        if not user_can_transform_file(get_current_user(), source):
            raise Forbidden(ResponseMessage.FORBIDDEN.value)

        transform = parser.parse(file_transform_args, request)
        try:
            transformed = transform_stored_image(source, transform["rotation"], transform.get("crop"))
        except InvalidImageTransform:
            raise BadRequest(ResponseMessage.INVALID_IMAGE_TRANSFORM.value)

        if transformed is source:
            return file_schema.dump(source)

        db.session.add(transformed)
        db.session.commit()
        return file_schema.dump(transformed), 201
