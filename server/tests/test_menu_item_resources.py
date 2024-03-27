import json

from tests.utils.user_test_util import get_login_headers


def test_successful_create_menu_item(client):
    access_headers, refresh_headers = get_login_headers(client)
    menu_item_data = {
        "type": "MENU_PAGE",
        "position": "BOTTOM",
        "menuPage": "f2b0606f-46f6-4012-be67-5315bba154d2"
    }

    rv = client.post('/api/menu-items', headers=access_headers, json=menu_item_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['type'] == "MENU_PAGE"
    assert res['position'] == "BOTTOM"
    assert res['orderIndex'] == 2
    assert res['menuPage']['title'] == "Datenschutzerklärung"
    assert res['id'] is not None


def test_successful_get_menu_items(client):
    rv = client.get('/api/menu-items')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 6
    assert res[1]['id'] == "6b99766e-4597-492f-a8f1-450f1af7cfa1"
    assert res[1]['type'] == "NEWS"
    assert res[1]['position'] == "TOP"
    assert res[1]['orderIndex'] == 0
    assert res[1]['menuPage'] == None


def test_successful_get_menu_item(client):
    rv = client.get('/api/menu-items/6b99766e-4597-492f-a8f1-450f1af7cfa1')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['id'] == "6b99766e-4597-492f-a8f1-450f1af7cfa1"
    assert res['type'] == "NEWS"
    assert res['position'] == "TOP"
    assert res['orderIndex'] == 0
    assert res['menuPage'] == None


def test_get_deleted_menu_item(client):
    rv = client.get('/api/menu-items/6b99766e-4597-492f-a8f1-450f1af7cfa2')
    assert rv.status_code == 404
    res = json.loads(rv.data)
    assert res['message'] == "ENTITY_NOT_FOUND"


def test_successful_delete_menu_item(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/menu-items/6b99766e-4597-492f-a8f1-450f1af7cfa1', headers=access_headers)
    assert rv.status_code == 204


def test_successful_edit_menu_item(client):
    access_headers, refresh_headers = get_login_headers(client)
    menu_item_data = {
        "type": "MENU_PAGE",
        "position": "BOTTOM",
        "menuPage": "f2b0606f-46f6-4012-be67-5315bba154d2"
    }

    rv = client.put('/api/menu-items/6b99766e-4597-492f-a8f1-450f1af7cfa1', headers=access_headers, json=menu_item_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['type'] == "MENU_PAGE"
    assert res['position'] == "BOTTOM"
    assert res['orderIndex'] == 2
    assert res['menuPage']['title'] == "Datenschutzerklärung"
    assert res['id'] == "6b99766e-4597-492f-a8f1-450f1af7cfa1"

def test_successful_order_menu_items_top(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.get('/api/menu-items')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res[1]['id'] == "6b99766e-4597-492f-a8f1-450f1af7cfa1"
    assert res[1]['orderIndex'] == 0
    assert res[5]['id'] == "561b2dab-57e6-41f6-9a33-b5d8022ec74f"
    assert res[5]['orderIndex'] == 3

    new_order = {
        "6b99766e-4597-492f-a8f1-450f1af7cfa1": 1,
        "561b2dab-57e6-41f6-9a33-b5d8022ec74f": 0,
        "9785be94-d092-45dc-b180-fda5ce2f55f2": 2,
        "22712785-2074-4d49-87ce-6defc7a01e2f": 3,
    }
    rv = client.put('/api/menu-items/update-order-top', headers=access_headers, json=new_order)
    assert rv.status_code == 200

    rv = client.get('/api/menu-items')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res[1]['id'] == "561b2dab-57e6-41f6-9a33-b5d8022ec74f"
    assert res[1]['orderIndex'] == 0
    assert res[3]['id'] == "6b99766e-4597-492f-a8f1-450f1af7cfa1"
    assert res[3]['orderIndex'] == 1

