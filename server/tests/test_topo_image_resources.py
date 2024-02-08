import json

from tests.utils.user_test_util import get_login_headers


def test_successful_add_topo_image(client):
    access_headers, refresh_headers = get_login_headers(client)
    topo_image_data = {
        "image": "f30f2563-afa1-466b-9331-9e80853a90bb",
    }
    rv = client.post('/api/areas/dritter-block-von-links/topo-images', headers=access_headers, json=topo_image_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert type(res['id']) == str
    assert res['image']['id'] == "f30f2563-afa1-466b-9331-9e80853a90bb"
    assert len(res['linePaths']) == 0


def test_successful_get_topo_images(client):
    rv = client.get('/api/areas/dritter-block-von-links/topo-images')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[0]['id'] == "4e8f0a85-b971-409b-a972-7805173b4a19"
    assert res[0]['image']['id'] == "f30f2563-afa1-466b-9331-9e80853a90bb"
    assert res[0]['orderIndex'] == 0
    assert res[1]['orderIndex'] == 1
    assert len(res[0]['linePaths'][0]['path']) == 8


def test_successful_get_topo_image(client):
    rv = client.get('/api/topo-images/4e8f0a85-b971-409b-a972-7805173b4a19')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['id'] == "4e8f0a85-b971-409b-a972-7805173b4a19"
    assert res['image']['id'] == "f30f2563-afa1-466b-9331-9e80853a90bb"
    assert len(res['linePaths'][0]['path']) == 8


def test_successful_delete_topo_image(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/topo-images/4e8f0a85-b971-409b-a972-7805173b4a19', headers=access_headers)
    assert rv.status_code == 204


def test_successful_order_topo_images(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.get('/api/areas/dritter-block-von-links/topo-images')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res[0]['id'] == "4e8f0a85-b971-409b-a972-7805173b4a19"
    assert res[0]['orderIndex'] == 0
    assert res[1]['id'] == "f4625acb-b0fe-41f6-ab3c-fa258e586f2c"
    assert res[1]['orderIndex'] == 1

    new_order = {
        "4e8f0a85-b971-409b-a972-7805173b4a19": 1,
        "f4625acb-b0fe-41f6-ab3c-fa258e586f2c": 0,
    }
    rv = client.put('/api/areas/dritter-block-von-links/topo-images/update-order', headers=access_headers,
                    json=new_order)
    assert rv.status_code == 200

    rv = client.get('/api/areas/dritter-block-von-links/topo-images')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res[1]['id'] == "4e8f0a85-b971-409b-a972-7805173b4a19"
    assert res[1]['orderIndex'] == 1
    assert res[0]['id'] == "f4625acb-b0fe-41f6-ab3c-fa258e586f2c"
    assert res[0]['orderIndex'] == 0
