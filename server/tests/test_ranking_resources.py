import json

from app import app
from tests.utils.user_test_util import get_login_headers
from util.scripts.build_rankings import build_rankings


def test_successful_get_ranking_boulder(client):
    rv = client.get('/api/ranking?line_type=BOULDER')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 1
    assert res[0]['user']['slug'] == "felix-engelmann"
    assert res[0]['top10'] == 22
    assert res[0]['top50'] == 22
    assert res[0]['totalCount'] == 1

    rv = client.get('/api/ranking?line_type=BOULDER&sector_id=008478de-5e0b-41b3-abe7-571f758c189b')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 1
    assert res[0]['user']['slug'] == "felix-engelmann"
    assert res[0]['top10'] == 22
    assert res[0]['top50'] == 22
    assert res[0]['totalCount'] == 1

    rv = client.get('/api/ranking?line_type=BOULDER&crag_id=aabc4539-c02f-4a03-8db3-ea0916e59884')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 1
    assert res[0]['user']['slug'] == "felix-engelmann"
    assert res[0]['top10'] == 22
    assert res[0]['top50'] == 22
    assert res[0]['totalCount'] == 1


def test_successful_get_ranking_invalid_type(client):
    rv = client.get('/api/ranking?line_type=BASKETBALL')
    assert rv.status_code == 400


def test_successful_get_ranking_invalid_crag_and_sector_query_params(client):
    rv = client.get(
        '/api/ranking?line_type=BOULDER&crag_id=6b9e873b-e48d-4f0e-9d86-c3b6d7aa9db0&sector_id=008478de-5e0b-41b3-abe7-571f758c189b')
    assert rv.status_code == 400


def test_successful_get_ranking_sport(client):
    rv = client.get('/api/ranking?line_type=SPORT')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 0


def test_successful_update_ranking(client):
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

    rv = client.get('/api/ranking/update', headers=access_headers, json=ascent_data)
    assert rv.status_code == 200

    rv = client.get('/api/ranking?line_type=BOULDER')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 1
    assert res[0]['user']['slug'] == "felix-engelmann"
    assert res[0]['top10'] == 23
    assert res[0]['top50'] == 23
    assert res[0]['totalCount'] == 2
