from flask import jsonify

from messages.messages import ResponseMessage


def setup_jwt_error_handlers(jwt):
    """
    Configures all error handlers for the JWT extension.
    :param jwt: JWT object to register the callbacks on.
    """

    @jwt.invalid_token_loader
    @jwt.unauthorized_loader
    def my_expired_token_callback(_token):
        response = jsonify({'code': 401, 'message': ResponseMessage.UNAUTHORIZED.value})
        response.status_code = 401
        return response, 401

    @jwt.expired_token_loader
    def my_expired_token_callback(_jwt_header, _jwt_data):
        response = jsonify({'code': 401, 'message': ResponseMessage.UNAUTHORIZED.value})
        response.status_code = 401
        return response, 401
