from flask import request, g
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from marshmallow_schemas.file_schema import file_schema
from messages.messages import ResponseMessage
from models.user import User
from uploader.errors import InvalidFiletypeUploaded, FilesizeLimitExceeded
from uploader.file_upload_handler import handle_file_upload
from uploader.media_upload_handler import handle_file_upload
from util.security_util import check_user_authorized
from webargs_schemas.upload_args import upload_args


class UploadFile(MethodView):

    @jwt_required()
    @check_user_authorized()
    def post(self):
        """
        Uploads a media file and creates a media model object for it.
        """
        args = parser.parse(upload_args, request, location='upload')
        try:
            file = handle_file_upload(args)
            file.created_by = g.user
            file.persist()
            return file_schema.dump(file), 201
        except InvalidFiletypeUploaded:
            raise BadRequest(ResponseMessage.INVALID_FILETYPE_UPLOADED.value)
        except FilesizeLimitExceeded as e:
            raise BadRequest(ResponseMessage.FILESIZE_LIMIT_EXCEEDED.value, extras=e.max_filesize)
