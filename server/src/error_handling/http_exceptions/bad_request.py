class BadRequest(Exception):
    status_code = 400

    def __init__(self, message, localcrag_err_code=None, extras=None):
        Exception.__init__(self)
        self.message = message
        self.localcrag_err_code = localcrag_err_code
        self.extras = extras

    def to_dict(self):
        return {"message": self.message, "localCragErrCode": self.localcrag_err_code, "extras": self.extras}
