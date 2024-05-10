import json

from tests.utils.user_test_util import get_login_headers


def test_successful_create_area(client):
    access_headers, refresh_headers = get_login_headers(client)
    area_data = {
        "name": "Kreuzfels",
        "description": "Super Bereich",
        "shortDescription": "Super Bereich Kurz",
        "lat": 12.13,
        "lng": 42.42,
        "portraitImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
        "secret": False,
    }

    rv = client.post('/api/sectors/schattental/areas', headers=access_headers, json=area_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['name'] == "Kreuzfels"
    assert res['slug'] == "kreuzfels"
    assert res['description'] == "Super Bereich"
    assert res['shortDescription'] == "Super Bereich Kurz"
    assert res['lat'] == 12.13
    assert res['lng'] == 42.42
    assert res['secret'] == False
    assert res['ascentCount'] == 0
    assert res['portraitImage']['id'] == '6137f55a-6201-45ab-89c5-6e9c29739d61'
    assert res['id'] is not None


def test_create_area_invalid_lat(client):
    access_headers, refresh_headers = get_login_headers(client)
    area_data = {
        "name": "Kreuzfels",
        "description": "Super Bereich",
        "shortDescription": "Super Bereich Kurz",
        "lat": -95,
        "lng": 42.42,
        "portraitImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
    }

    rv = client.post('/api/sectors/schattental/areas', headers=access_headers, json=area_data)
    assert rv.status_code == 400


def test_create_area_invalid_lng(client):
    access_headers, refresh_headers = get_login_headers(client)
    area_data = {
        "name": "Kreuzfels",
        "description": "Super Bereich",
        "shortDescription": "Super Bereich Kurz",
        "lat": 42.42,
        "lng": 190.9,
        "portraitImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
    }

    rv = client.post('/api/sectors/schattental/areas', headers=access_headers, json=area_data)
    assert rv.status_code == 400


def test_successful_get_areas(client):
    rv = client.get('/api/sectors/schattental/areas')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[0]['id'] == "e5bc6b6b-a72a-48e5-a2cc-37bfc7b7183f"
    assert res[0]['slug'] == "dritter-block-von-links"
    assert res[0]['name'] == "Dritter Block von links"
    assert res[0]['shortDescription'] == None
    assert res[0]['orderIndex'] == 0
    assert res[0]['ascentCount'] == 1
    assert res[0]['secret'] == False
    assert res[0]['portraitImage']['id'] == 'e8be1c78-1912-405c-861c-883967485838'
    assert res[1]['id'] == "8c3c70ca-c66c-4e45-85c0-72d46778bec4"
    assert res[1]['slug'] == "noch-ein-bereich"
    assert res[1]['name'] == "Noch ein Bereich"
    assert res[1]['shortDescription'] == None
    assert res[1]['orderIndex'] == 1
    assert res[1]['ascentCount'] == 0
    assert res[1]['secret'] == False
    assert res[1]['portraitImage'] == None


def test_successful_get_area(client):
    rv = client.get('/api/areas/dritter-block-von-links')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['id'] == "e5bc6b6b-a72a-48e5-a2cc-37bfc7b7183f"
    assert res['slug'] == "dritter-block-von-links"
    assert res['name'] == "Dritter Block von links"
    assert res['description'] == "<p>Allgemeine Infos zum dritten Block von links.</p>"
    assert res['shortDescription'] == None
    assert res['lat'] == 34.343434
    assert res['lng'] == 29.292929
    assert res['ascentCount'] == 1
    assert res['secret'] == False
    assert res['portraitImage']['id'] == 'e8be1c78-1912-405c-861c-883967485838'


def test_get_deleted_area(client):
    rv = client.get('/api/areas/bereich-existiert-nicht-mehr')
    assert rv.status_code == 404
    res = json.loads(rv.data)
    assert res['message'] == "ENTITY_NOT_FOUND"


def test_successful_delete_area(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/areas/dritter-block-von-links', headers=access_headers)
    assert rv.status_code == 204


def test_successful_edit_area(client):
    access_headers, refresh_headers = get_login_headers(client)
    area_data = {
        "name": "Vierter Block von rechts",
        "description": "Test edit",
        "shortDescription": "Test edit short",
        "lat": 42.1,
        "lng": 42.2,
        "portraitImage": None,
        "secret": False,
    }

    rv = client.put('/api/areas/dritter-block-von-links', headers=access_headers, json=area_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['name'] == "Vierter Block von rechts"
    assert res['slug'] == "vierter-block-von-rechts"
    assert res['description'] == "Test edit"
    assert res['shortDescription'] == "Test edit short"
    assert res['lat'] == 42.1
    assert res['lng'] == 42.2
    assert res['ascentCount'] == 1
    assert res['portraitImage'] == None
    assert res['secret'] == False
    assert res['id'] is not None


def test_successful_order_areas(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.get('/api/sectors/schattental/areas')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res[0]['id'] == "e5bc6b6b-a72a-48e5-a2cc-37bfc7b7183f"
    assert res[0]['orderIndex'] == 0
    assert res[1]['id'] == "8c3c70ca-c66c-4e45-85c0-72d46778bec4"
    assert res[1]['orderIndex'] == 1

    new_order = {
        "e5bc6b6b-a72a-48e5-a2cc-37bfc7b7183f": 1,
        "8c3c70ca-c66c-4e45-85c0-72d46778bec4": 0,
    }
    rv = client.put('/api/sectors/schattental/areas/update-order', headers=access_headers, json=new_order)
    assert rv.status_code == 200

    rv = client.get('/api/sectors/schattental/areas')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res[1]['id'] == "e5bc6b6b-a72a-48e5-a2cc-37bfc7b7183f"
    assert res[1]['orderIndex'] == 1
    assert res[0]['id'] == "8c3c70ca-c66c-4e45-85c0-72d46778bec4"
    assert res[0]['orderIndex'] == 0


def test_successful_get_area_grades(client):
    rv = client.get('/api/areas/dritter-block-von-links/grades')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[0]['gradeName'] == "1"
    assert res[0]['gradeScale'] == "FB"
    assert res[1]['gradeName'] == "8A"
    assert res[1]['gradeScale'] == "FB"
