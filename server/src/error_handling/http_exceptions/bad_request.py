class BadRequest(Exception):
    status_code = 400

    def __init__(self, message, action_directe_err_code=None, extras=None):
        Exception.__init__(self)
        self.message = message
        self.action_directe_err_code = action_directe_err_code
        self.extras = extras

    def to_dict(self):
        return {
            'message': self.message,
            'actionDirecteErrCode': self.action_directe_err_code,
            'extras': self.extras
        }
