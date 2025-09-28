from flask import request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.file_schema import files_schema
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
            files = []
            file_payloads = request.files.getlist("upload")
            for file_payload in file_payloads:
                file = handle_file_upload(file_payload)
                file.created_by = User.find_by_email(get_jwt_identity())
                db.session.add(file)
                files.append(file)
            db.session.commit()
            return files_schema.dump(files), 201
        except InvalidFiletypeUploaded:
            raise BadRequest(ResponseMessage.INVALID_FILETYPE_UPLOADED.value)
        except FilesizeLimitExceeded as e:
            raise BadRequest(ResponseMessage.FILESIZE_LIMIT_EXCEEDED.value, extras=e.max_filesize)
