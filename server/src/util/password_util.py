import secrets
import string


def generate_password() -> str:
    """
    Generates a safe random 20 char digits password.
    :return: Password.
    """
    alphabet = string.ascii_letters + string.digits + string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(alphabet) for _ in range(20))
    return password
