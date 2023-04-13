from messages.messages import ResponseMessage


class NotFound(Exception):
    status_code = 404

    def __init__(self, message=ResponseMessage.ENTITY_NOT_FOUND.value):
        Exception.__init__(self)
        self.message = message

    def to_dict(self):
        return {
            'message': self.message
        }
