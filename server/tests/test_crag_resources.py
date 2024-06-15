import json

from tests.utils.user_test_util import get_login_headers


def test_successful_create_crag(client):
    access_headers, refresh_headers = get_login_headers(client)
    crag_data = {
        "name": "Glees",
        "description": "Fodere et scandere.",
        "shortDescription": "Fodere et scandere 2.",
        "rules": "Parken nur Samstag und Sonntag.",
        "portraitImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
        "lat": 12.13,
        "lng": 42.42,
        "secret": False,
    }

    rv = client.post('/api/crags', headers=access_headers, json=crag_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['name'] == "Glees"
    assert res['slug'] == "glees"
    assert res['description'] == "Fodere et scandere."
    assert res['shortDescription'] == "Fodere et scandere 2."
    assert res['rules'] == "Parken nur Samstag und Sonntag."
    assert res['lat'] == 12.13
    assert res['lng'] == 42.42
    assert res['portraitImage']['id'] == '6137f55a-6201-45ab-89c5-6e9c29739d61'
    assert res['id'] is not None
    assert res['orderIndex'] == 2
    assert res['ascentCount'] == 0
    assert res['secret'] == False


def test_successful_get_crags(client):
    rv = client.get('/api/crags')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[0]['id'] == "aabc4539-c02f-4a03-8db3-ea0916e59884"
    assert res[0]['slug'] == "brione"
    assert res[0]['name'] == "Brione"
    assert res[0]['orderIndex'] == 0
    assert res[0]['ascentCount'] == 1
    assert res[0]['secret'] == False
    assert res[0]['shortDescription'] == "Kurze Beschreibung zu Brione"
    assert res[0]['portraitImage']['id'] == '73a5a4cc-4ff4-4b7c-a57d-aa006f49aa08'
    assert res[1]['id'] == "6b9e873b-e48d-4f0e-9d86-c3b6d7aa9db0"
    assert res[1]['slug'] == "chironico"
    assert res[1]['name'] == "Chironico"
    assert res[1]['orderIndex'] == 1
    assert res[1]['ascentCount'] == 0
    assert res[1]['secret'] == False
    assert res[1]['shortDescription'] == "Kurze Beschreibung zu Chironico"
    assert res[1]['portraitImage']['id'] == 'b668385f-9693-414a-a4c7-4da6f3ba405d'


def test_successful_get_crag(client):
    rv = client.get('/api/crags/brione')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['id'] == "aabc4539-c02f-4a03-8db3-ea0916e59884"
    assert res['name'] == "Brione"
    assert res['slug'] == "brione"
    assert res['orderIndex'] == 0
    assert res['ascentCount'] == 1
    assert res['portraitImage']['id'] == '73a5a4cc-4ff4-4b7c-a57d-aa006f49aa08'
    assert res['description'] == "<p>Lange Beschreibung zu Brione.</p>"
    assert res['shortDescription'] == "Kurze Beschreibung zu Brione"
    assert res['rules'] == "<p>Briones Regeln.</p>"
    assert res['lat'] == None
    assert res['lng'] == None
    assert res['secret'] == False


def test_get_deleted_crag(client):
    rv = client.get('/api/crags/hohenfels')
    assert rv.status_code == 404
    res = json.loads(rv.data)
    assert res['message'] == "ENTITY_NOT_FOUND"


def test_successful_delete_crag(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/crags/brione', headers=access_headers)
    assert rv.status_code == 204


def test_successful_edit_crag(client):
    access_headers, refresh_headers = get_login_headers(client)
    crag_data = {
        "name": "Glees 2",
        "description": "Fodere et scandere. 2",
        "shortDescription": "Fodere et scandere 3.",
        "rules": "Parken nur Samstag und Sonntag 2.",
        "portraitImage": '73a5a4cc-4ff4-4b7c-a57d-aa006f49aa08',
        "lat": 42.1,
        "lng": 42.2,
        "secret": False,
    }

    rv = client.put('/api/crags/brione', headers=access_headers, json=crag_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['name'] == "Glees 2"
    assert res['slug'] == "glees-2"
    assert res['description'] == "Fodere et scandere. 2"
    assert res['shortDescription'] == "Fodere et scandere 3."
    assert res['rules'] == "Parken nur Samstag und Sonntag 2."
    assert res['portraitImage']['id'] == '73a5a4cc-4ff4-4b7c-a57d-aa006f49aa08'
    assert res['lat'] == 42.1
    assert res['lng'] == 42.2
    assert res['orderIndex'] == 0
    assert res['ascentCount'] == 1
    assert res['secret'] == False
    assert res['id'] is not None


def test_successful_order_crags(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.get('/api/crags')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res[0]['id'] == "aabc4539-c02f-4a03-8db3-ea0916e59884"
    assert res[0]['orderIndex'] == 0
    assert res[1]['id'] == "6b9e873b-e48d-4f0e-9d86-c3b6d7aa9db0"
    assert res[1]['orderIndex'] == 1

    new_order = {
        "aabc4539-c02f-4a03-8db3-ea0916e59884": 1,
        "6b9e873b-e48d-4f0e-9d86-c3b6d7aa9db0": 0,
    }
    rv = client.put('/api/crags/update-order', headers=access_headers, json=new_order)
    assert rv.status_code == 200

    rv = client.get('/api/crags')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res[1]['id'] == "aabc4539-c02f-4a03-8db3-ea0916e59884"
    assert res[1]['orderIndex'] == 1
    assert res[0]['id'] == "6b9e873b-e48d-4f0e-9d86-c3b6d7aa9db0"
    assert res[0]['orderIndex'] == 0


def test_order_crags_wrong_number_of_items(client):
    access_headers, refresh_headers = get_login_headers(client)

    new_order = {
        "aabc4539-c02f-4a03-8db3-ea0916e59884": 1,
        "6b9e873b-e48d-4f0e-9d86-c3b6d7aa9db0": 0,
        "6b9e873b-e48d-4f0e-9d86-c3b6d7aa9db1": 2,
    }
    rv = client.put('/api/crags/update-order', headers=access_headers, json=new_order)
    assert rv.status_code == 400


def test_order_crags_bad_indexes(client):
    access_headers, refresh_headers = get_login_headers(client)

    new_order = {
        "aabc4539-c02f-4a03-8db3-ea0916e59884": 2,
        "6b9e873b-e48d-4f0e-9d86-c3b6d7aa9db0": 0,
    }
    rv = client.put('/api/crags/update-order', headers=access_headers, json=new_order)
    assert rv.status_code == 400


def test_successful_get_crag_grades(client):
    rv = client.get('/api/crags/brione/grades')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[1]['gradeName'] == "1"
    assert res[1]['gradeScale'] == "FB"
    assert res[0]['gradeName'] == "8A"
    assert res[0]['gradeScale'] == "FB"
