import json

from messages.messages import ResponseMessage


def get_login_headers(client, email: str = 'localcrag@fengelmann.de', password: str = '[vb+xLGgU?+Z]nXD3HmO'):
    """
    Logs in with the given credentials and returns a tuple of access and refresh headers.
    :param client: Client to use.
    :param email: Email to log in with (defaults to the root users email).
    :param password: Password to log in with (defaults to the root users password).
    :return: (access_headers, refresh_headers)
    """
    data = {
        'email': email,
        'password': password
    }
    rv = client.post('/api/login', json=data)
    assert rv.status_code == 202
    res = json.loads(rv.data)
    assert res['message'] == ResponseMessage.LOGIN_SUCCESS.value
    access_headers = {
        'Authorization': 'Bearer {}'.format(res['accessToken'])
    }
    refresh_headers = {
        'Authorization': 'Bearer {}'.format(res['refreshToken'])
    }
    return access_headers, refresh_headers
