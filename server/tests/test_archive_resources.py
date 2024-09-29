import json

from tests.utils.user_test_util import get_login_headers

def base_test_archived(client, archive_data, access_headers, typ):
    for val in [True, False]:
        archive_data["archived"] = val

        rv = client.post('/api/archive', headers=access_headers, json=archive_data)
        assert rv.status_code == 200

        rv = client.get('/api/lines', headers=access_headers)
        assert rv.status_code == 200
        res = json.loads(rv.data)
        for line in res['items']:
            if line[typ + "Slug"] == archive_data[typ]:
                assert line["archived"] == archive_data["archived"]


def test_successful_switch_line_archived(client):
    access_headers, refresh_headers = get_login_headers(client)
    archive_data = {
        "line": "treppe",
        "archived": True,
    }

    rv = client.post('/api/archive', headers=access_headers, json=archive_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['lines'] == 1
    assert res['topo_images'] == 0

    # Marking something twice as archived should not be an issue
    rv = client.post('/api/archive', headers=access_headers, json=archive_data)
    assert rv.status_code == 200

    rv = client.get('/api/lines', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    for line in res['items']:
        if line["slug"] == archive_data["line"]:
            assert line["archived"] == archive_data["archived"]

    archive_data["archived"] = False

    rv = client.post('/api/archive', headers=access_headers, json=archive_data)
    assert rv.status_code == 200

    rv = client.get('/api/lines', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    for line in res['items']:
        if line["slug"] == archive_data["line"]:
            assert line["archived"] == archive_data["archived"]


def test_successful_switch_area_archived(client):
    access_headers, refresh_headers = get_login_headers(client)
    archive_data = {
        "area": "dritter-block-von-links",
    }

    base_test_archived(client, archive_data, access_headers, typ="area")


def test_successful_switch_sector_archived(client):
    access_headers, refresh_headers = get_login_headers(client)
    archive_data = {
        "sector": "schattental",
    }

    base_test_archived(client, archive_data, access_headers, typ="sector")


def test_successful_switch_crag_archived(client):
    access_headers, refresh_headers = get_login_headers(client)
    archive_data = {
        "crag": "brione",
    }

    base_test_archived(client, archive_data, access_headers, typ="crag")
