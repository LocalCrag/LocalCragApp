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

def test_successful_order_line_paths(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.get('/api/areas/dritter-block-von-links/topo-images')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[0]['linePaths'][0]['id'] == "74b746bb-2d79-4ba5-800d-a73af2c60507"
    assert res[0]['linePaths'][1]['id'] == "f2c62a33-373d-46ab-94ee-7da16239e126"

    new_order = {
        "74b746bb-2d79-4ba5-800d-a73af2c60507": 1,
        "f2c62a33-373d-46ab-94ee-7da16239e126": 0,
    }
    rv = client.put('/api/topo-images/4e8f0a85-b971-409b-a972-7805173b4a19/line-paths/update-order', headers=access_headers, json=new_order)
    assert rv.status_code == 200

    rv = client.get('/api/areas/dritter-block-von-links/topo-images')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[0]['linePaths'][0]['id'] == "f2c62a33-373d-46ab-94ee-7da16239e126"
    assert res[0]['linePaths'][1]['id'] == "74b746bb-2d79-4ba5-800d-a73af2c60507"
