from messages.messages import ResponseMessage


class InternalServerError(Exception):  # pragma: no cover
    status_code = 500

    def __init__(self, message=None):
        Exception.__init__(self)
        if not message:
            self.message = ResponseMessage.INTERNAL_SERVER_ERROR.value
        else:
            self.message = message

    def to_dict(self):
        return {
            'message': self.message
        }
