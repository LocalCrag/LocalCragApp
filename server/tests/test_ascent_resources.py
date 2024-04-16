import json

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