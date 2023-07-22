import os

from flask import request, g
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser
from werkzeug.datastructures import FileStorage

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.file_schema import file_schema
from messages.messages import ResponseMessage
from uploader.errors import InvalidFiletypeUploaded, FilesizeLimitExceeded
from uploader.media_upload_handler import handle_file_upload
from util.security_util import check_user_authorized


class UploadFile(MethodView):

    @jwt_required()
    @check_user_authorized()
    def post(self):
        """
        Uploads a file and creates a file model object for it.
        """
        try:
            file = handle_file_upload(request.files.get('upload'))
            file.created_by = g.user
            db.session.add(file)
            db.session.commit()
            return file_schema.dump(file), 201
        except InvalidFiletypeUploaded:
            raise BadRequest(ResponseMessage.INVALID_FILETYPE_UPLOADED.value)
        except FilesizeLimitExceeded as e:
            raise BadRequest(ResponseMessage.FILESIZE_LIMIT_EXCEEDED.value, extras=e.max_filesize)
