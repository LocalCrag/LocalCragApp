from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest


def setup_webargs_error_handlers():
    """
    Configures all error handlers for marshmallow webargs.
    """

    # noinspection PyUnusedLocal
    @parser.error_handler
    def handle_error(error, req, schema, *, error_status_code, error_headers):
        """
        Gets a webargs parsing error and forwards it as a bad request error.
        @param error_headers: Headers of the handled errors.
        @param error_status_code: Status code of the handled error.
        @param schema: Marshmallow schema to format the error.
        @param req: Request that caused the error.
        @param error: Webargs error.
        """
        raise BadRequest(error.messages)
