from flask import jsonify
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from messages.messages import ResponseMessage
from models.user import User


class DeleteOwnUser(MethodView):

    @jwt_required()
    def delete(self):
        """
        Deletes the currently authenticated user. Not allowed for superadmins.
        """
        user = User.find_by_email(get_jwt_identity())
        if not user:
            # Should not happen with valid tokens, but handle gracefully
            from error_handling.http_exceptions.unauthorized import Unauthorized

            raise Unauthorized(ResponseMessage.UNAUTHORIZED.value)

        if user.superadmin:
            raise BadRequest(ResponseMessage.CANNOT_DELETE_SUPERADMIN.value)

        db.session.delete(user)
        db.session.commit()
        return jsonify(None), 204
