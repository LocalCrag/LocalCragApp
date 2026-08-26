from models.user import User


class SimpleMessage:
    """
    A class for marshalling a simple message response.
    """

    def __init__(self, message: str):
        self.message = message


class AuthResponse:
    """
    Marshalling object for an authorization response.
    """

    def __init__(self, message: str, user: User):
        self.message = message
        self.user = user
