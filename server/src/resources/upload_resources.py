from flask import request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.file_schema import file_schema
from messages.messages import ResponseMessage
from models.user import User
from uploader.errors import FilesizeLimitExceeded, InvalidFiletypeUploaded
from uploader.media_upload_handler import handle_file_upload


class UploadFile(MethodView):

    @jwt_required()
    def post(self):
        """
        Uploads a file and creates a file model object for it.
        """
        try:
            file = handle_file_upload(request.files.get("upload"))
            file.created_by = User.find_by_email(get_jwt_identity())
            db.session.add(file)
            db.session.commit()
            return file_schema.dump(file), 201
        except InvalidFiletypeUploaded:
            raise BadRequest(ResponseMessage.INVALID_FILETYPE_UPLOADED.value)
        except FilesizeLimitExceeded as e:
            raise BadRequest(ResponseMessage.FILESIZE_LIMIT_EXCEEDED.value, extras=e.max_filesize)
