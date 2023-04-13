from flask import jsonify

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.conflict import Conflict
from error_handling.http_exceptions.internal_server_error import InternalServerError
from error_handling.http_exceptions.not_found import NotFound
from error_handling.http_exceptions.unauthorized import Unauthorized


def setup_http_error_handlers(app):
    """
    Configures all http error handlers for the app.
    :param app: App object to register the callbacks on.
    """

    @app.errorhandler(BadRequest)
    def handle_bad_request(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(NotFound)
    def handle_not_found(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(Conflict)
    def handle_conflict(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(InternalServerError)
    def handle_internal_server_error(error):  # pragma: no cover
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(Unauthorized)
    def handle_unauthorized(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response
