class Forbidden(Exception):
    status_code = 403

    def __init__(self, message):
        Exception.__init__(self)
        self.message = message

    def to_dict(self):
        return {"message": self.message}
