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
    }

    rv = client.post('/api/regions/d2c864b4-ca80-4d01-a8bf-41521182b5d4/crags', headers=access_headers, json=crag_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['name'] == "Glees"
    assert res['slug'] == "glees"
    assert res['description'] == "Fodere et scandere."
    assert res['shortDescription'] == "Fodere et scandere 2."
    assert res['rules'] == "Parken nur Samstag und Sonntag."
    assert res['portraitImage']['id'] == '6137f55a-6201-45ab-89c5-6e9c29739d61'
    assert res['id'] is not None


def test_successful_get_crags(client):
    rv = client.get('/api/crags')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[0]['id'] == "aabc4539-c02f-4a03-8db3-ea0916e59884"
    assert res[0]['slug'] == "brione"
    assert res[0]['name'] == "Brione"
    assert res[0]['shortDescription'] == "Kurze Beschreibung zu Brione"
    assert res[0]['portraitImage']['id'] == '73a5a4cc-4ff4-4b7c-a57d-aa006f49aa08'
    assert res[1]['id'] == "6b9e873b-e48d-4f0e-9d86-c3b6d7aa9db0"
    assert res[1]['slug'] == "chironico"
    assert res[1]['name'] == "Chironico"
    assert res[1]['shortDescription'] == "Kurze Beschreibung zu Chironico"
    assert res[1]['portraitImage']['id'] == 'b668385f-9693-414a-a4c7-4da6f3ba405d'


def test_successful_get_crag(client):
    rv = client.get('/api/crags/brione')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['id'] == "aabc4539-c02f-4a03-8db3-ea0916e59884"
    assert res['name'] == "Brione"
    assert res['slug'] == "brione"
    assert res['portraitImage']['id'] == '73a5a4cc-4ff4-4b7c-a57d-aa006f49aa08'
    assert res['description'] == "<p>Lange Beschreibung zu Brione.</p>"
    assert res['shortDescription'] == "Kurze Beschreibung zu Brione"
    assert res['rules'] == "<p>Briones Regeln.</p>"


def test_get_deleted_crag(client):
    rv = client.get('/api/crags/cf6f3058-48e7-4229-8172-58d48b758a89')
    assert rv.status_code == 404
    res = json.loads(rv.data)
    assert res['message'] == "ENTITY_NOT_FOUND"


def test_successful_delete_crag(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/crags/aabc4539-c02f-4a03-8db3-ea0916e59884', headers=access_headers)
    assert rv.status_code == 204


def test_successful_edit_crag(client):
    access_headers, refresh_headers = get_login_headers(client)
    crag_data = {
        "name": "Glees 2",
        "description": "Fodere et scandere. 2",
        "shortDescription": "Fodere et scandere 3.",
        "rules": "Parken nur Samstag und Sonntag 2.",
        "portraitImage": '73a5a4cc-4ff4-4b7c-a57d-aa006f49aa08',
    }

    rv = client.put('/api/crags/aabc4539-c02f-4a03-8db3-ea0916e59884', headers=access_headers, json=crag_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['name'] == "Glees 2"
    assert res['slug'] == "glees-2"
    assert res['description'] == "Fodere et scandere. 2"
    assert res['shortDescription'] == "Fodere et scandere 3."
    assert res['rules'] == "Parken nur Samstag und Sonntag 2."
    assert res['portraitImage']['id'] == '73a5a4cc-4ff4-4b7c-a57d-aa006f49aa08'
    assert res['id'] is not None
