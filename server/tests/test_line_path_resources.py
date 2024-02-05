import json

from tests.utils.user_test_util import get_login_headers


def test_successful_delete_line_path(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/line-paths/74b746bb-2d79-4ba5-800d-a73af2c60507', headers=access_headers)
    assert rv.status_code == 204


def test_successful_add_line_path(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_path_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
        "path": [1, 2, 3, 4]
    }
    rv = client.post('/api/topo-images/f4625acb-b0fe-41f6-ab3c-fa258e586f2c/line-paths', headers=access_headers,
                     json=line_path_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert type(res['id']) == str
    assert res['line']['id'] == "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0"
    assert len(res['path']) == 4


def test_add_line_path_path_too_short(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_path_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
        "path": [1, 2]
    }
    rv = client.post('/api/topo-images/f4625acb-b0fe-41f6-ab3c-fa258e586f2c/line-paths', headers=access_headers,
                     json=line_path_data)
    assert rv.status_code == 400


def test_add_line_path_path_out_of_bounds(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_path_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
        "path": [1, 2, 101, 101]
    }
    rv = client.post('/api/topo-images/f4625acb-b0fe-41f6-ab3c-fa258e586f2c/line-paths', headers=access_headers,
                     json=line_path_data)
    assert rv.status_code == 400


def test_add_line_path_path_not_even(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_path_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
        "path": [1, 2, 100]
    }
    rv = client.post('/api/topo-images/f4625acb-b0fe-41f6-ab3c-fa258e586f2c/line-paths', headers=access_headers,
                     json=line_path_data)
    assert rv.status_code == 400


def test_add_line_path_path_duplicate_line(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_path_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
        "path": [1, 2, 10, 100]
    }
    rv = client.post('/api/topo-images/4e8f0a85-b971-409b-a972-7805173b4a19/line-paths', headers=access_headers,
                     json=line_path_data)
    assert rv.status_code == 400
