from flask import request
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from marshmallow_schemas.file_schema import file_schema
from models.file import File
from util.security_util import check_auth_claims
from webargs_schemas.file_args import file_focus_args


class UpdateFile(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
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
