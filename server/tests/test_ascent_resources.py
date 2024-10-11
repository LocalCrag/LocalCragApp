import json

from sqlalchemy import text

from app import app
from extensions import db
from tests.utils.user_test_util import get_login_headers


def test_successful_create_ascent(client):
    access_headers, refresh_headers = get_login_headers(client)
    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": True,
        "hard": False,
        "withKneepad": True,
        "rating": 2,
        "comment": "Hahahahaha",
        "year": None,
        "gradeScale": "FB",
        "gradeName": "6A",
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
        "date": "2024-04-13"
    }

    rv = client.post('/api/ascents', headers=access_headers, json=ascent_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['flash'] == True
    assert res['fa'] == False
    assert res['soft'] == True
    assert res['hard'] == False
    assert res['withKneepad'] == True
    assert res['rating'] == 2
    assert res['comment'] == "Hahahahaha"
    assert res['year'] == None
    assert res['gradeScale'] == "FB"
    assert res['gradeName'] == "6A"
    assert res['date'] == "2024-04-13"
    assert res['line']['slug'] == "treppe"
    assert res['area']['slug'] == "dritter-block-von-links"
    assert res['sector']['slug'] == "schattental"
    assert res['crag']['slug'] == "brione"

    # Check updated ascent counts
    rv = client.get('/api/lines/treppe')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['ascentCount'] == 1

    rv = client.get('/api/areas/dritter-block-von-links')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['ascentCount'] == 2

    rv = client.get('/api/sectors/schattental')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['ascentCount'] == 2

    rv = client.get('/api/crags/brione')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['ascentCount'] == 2

    rv = client.get('/api/region')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['ascentCount'] == 2


def test_successful_update_ascent(client):
    access_headers, refresh_headers = get_login_headers(client)
    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": True,
        "hard": False,
        "withKneepad": True,
        "rating": 2,
        "comment": "Hahahahaha",
        "year": None,
        "gradeScale": "FB",
        "gradeName": "6A",
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
        "date": "2024-04-13"
    }

    rv = client.put('/api/ascents/55e840b9-2036-4725-a408-67d977adece5', headers=access_headers, json=ascent_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['flash'] == True
    assert res['fa'] == False
    assert res['soft'] == True
    assert res['hard'] == False
    assert res['withKneepad'] == True
    assert res['rating'] == 2
    assert res['comment'] == "Hahahahaha"
    assert res['year'] == None
    assert res['gradeScale'] == "FB"
    assert res['gradeName'] == "6A"
    assert res['date'] == "2024-04-13"
    assert res['line']['slug'] == "super-spreader"
    assert res['area']['slug'] == "dritter-block-von-links"
    assert res['sector']['slug'] == "schattental"
    assert res['crag']['slug'] == "brione"


def test_log_twice(client):
    access_headers, refresh_headers = get_login_headers(client)
    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": True,
        "hard": False,
        "withKneepad": True,
        "rating": 2,
        "comment": "Hahahahaha",
        "year": None,
        "gradeScale": "FB",
        "gradeName": "6A",
        "line": "1c39fd1f-6341-4161-a83f-e5de0f861c48",
        "date": "2024-04-13"
    }

    rv = client.post('/api/ascents', headers=access_headers, json=ascent_data)
    assert rv.status_code == 400


def test_create_ascent_non_existing_line(client):
    access_headers, refresh_headers = get_login_headers(client)
    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": True,
        "hard": False,
        "withKneepad": True,
        "rating": 2,
        "comment": "Hahahahaha",
        "year": None,
        "gradeScale": "FB",
        "gradeName": "6A",
        "line": "8d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
        "date": "2024-04-13"
    }

    rv = client.post('/api/ascents', headers=access_headers, json=ascent_data)
    assert rv.status_code == 404


def test_successful_get_ascents(client):
    rv = client.get('/api/ascents?page=1')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['items']) == 1
    assert res['items'][0]['id'] == "55e840b9-2036-4725-a408-67d977adece5"
    assert res['items'][0]['flash'] == False
    assert res['items'][0]['fa'] == True
    assert res['items'][0]['soft'] == False
    assert res['items'][0]['hard'] == True
    assert res['items'][0]['withKneepad'] == True
    assert res['items'][0]['rating'] == 3
    assert res['items'][0]['comment'] == "Yeeha!"
    assert res['items'][0]['year'] == None
    assert res['items'][0]['gradeScale'] == "FB"
    assert res['items'][0]['gradeName'] == "8A"
    assert res['items'][0]['date'] == "2024-04-16"
    assert res['items'][0]['line']['slug'] == "super-spreader"
    assert res['items'][0]['area']['slug'] == "dritter-block-von-links"
    assert res['items'][0]['sector']['slug'] == "schattental"
    assert res['items'][0]['crag']['slug'] == "brione"
    assert res['hasNext'] == False

    rv = client.get('/api/ascents?crag_id=6b9e873b-e48d-4f0e-9d86-c3b6d7aa9db0&page=1')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['items']) == 0

    rv = client.get('/api/ascents?crag_id=aabc4539-c02f-4a03-8db3-ea0916e59884&page=1')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['items']) == 1

    rv = client.get('/api/ascents?page=2')
    assert rv.status_code == 404


def test_successful_get_ticks(client):
    rv = client.get(
        '/api/ticks?user_id=1543885f-e9ef-48c5-a396-6c898fb42409&crag_id=aabc4539-c02f-4a03-8db3-ea0916e59884')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 1
    assert res[0] == "1c39fd1f-6341-4161-a83f-e5de0f861c48"

    rv = client.get(
        '/api/ticks?user_id=2543885f-e9ef-48c5-a396-6c898fb42409&crag_id=aabc4539-c02f-4a03-8db3-ea0916e59884')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 0


def test_successful_delete_ascent(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/ascents/55e840b9-2036-4725-a408-67d977adece5', headers=access_headers)
    assert rv.status_code == 204

    # Line must be still there
    rv = client.get('/api/lines/super-spreader')
    assert rv.status_code == 200


def test_delete_user_deletes_tick_but_not_line(client):
    # Change ascent owner as you cannot delete own user
    with app.app_context():
        with db.engine.begin() as conn:
            conn.execute(text(
                "update ascents set created_by_id = '2543885f-e9ef-48c5-a396-6c898fb42409' where created_by_id = '1543885f-e9ef-48c5-a396-6c898fb42409';"))

    # Make user a non-superadmin as superadmins cannot be deleted
    with app.app_context():
        with db.engine.begin() as conn:
            conn.execute(text(
                "update users set superadmin = false where id = '2543885f-e9ef-48c5-a396-6c898fb42409';"))

    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/users/2543885f-e9ef-48c5-a396-6c898fb42409', headers=access_headers, json=None)
    assert rv.status_code == 204

    # Tick is gone
    rv = client.get('/api/ascents?page=1')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['items']) == 0

    # Line must be still there
    rv = client.get('/api/lines/super-spreader')
    assert rv.status_code == 200

def test_send_project_climbed_message(client):
    access_headers, refresh_headers = get_login_headers(client)

    # TODO: Implement this test and also some fail cases
    assert False