import time

from models.crag import Crag
from models.line import Line
from models.sector import Sector


def test_successful_get_ranking_boulder(client):
    rv = client.get("/api/ranking?line_type=BOULDER")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 1
    assert res[0]["user"]["slug"] == "admin-admin"
    assert res[0]["top10"] == 22
    assert res[0]["top50"] == 22
    assert res[0]["totalCount"] == 1

    rv = client.get(f'/api/ranking?line_type=BOULDER&sector_id={Sector.get_id_by_slug("schattental")}')
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 1
    assert res[0]["user"]["slug"] == "admin-admin"
    assert res[0]["top10"] == 22
    assert res[0]["top50"] == 22
    assert res[0]["totalCount"] == 1

    rv = client.get(f'/api/ranking?line_type=BOULDER&crag_id={Crag.get_id_by_slug("brione")}')
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 1
    assert res[0]["user"]["slug"] == "admin-admin"
    assert res[0]["top10"] == 22
    assert res[0]["top50"] == 22
    assert res[0]["totalCount"] == 1


def test_successful_get_ranking_invalid_type(client):
    rv = client.get("/api/ranking?line_type=BASKETBALL")
    assert rv.status_code == 400


def test_successful_get_ranking_invalid_crag_and_sector_query_params(client):
    rv = client.get(
        f'/api/ranking?line_type=BOULDER&crag_id={Crag.get_id_by_slug("brione")}&sector_id={Sector.get_id_by_slug("schattental")}'
    )
    assert rv.status_code == 400


def test_successful_get_ranking_sport(client):
    rv = client.get("/api/ranking?line_type=SPORT")
    assert rv.status_code == 200
    res = rv.json
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
        "gradeValue": 10,
        "line": str(Line.get_id_by_slug("treppe")),
        "date": "2024-04-13",
    }
    rv = client.post("/api/ascents", token=admin_token, json=ascent_data)
    assert rv.status_code == 201

    rv = client.get("/api/ranking/update", headers={"Authorization": f"Bearer thisTokenIsNotSecretChangeIt"})
    assert rv.status_code == 200

    # We don't know when the thread completes from the previous request. So we need to wait for the ranking to be updated.
    # We will wait for a maximum of 5 seconds and check with increasing intervals. If the ranking is not updated by then, we will fail the test.
    max_wait_time = 5
    wait_time = 0.5
    total_wait_time = 0

    while total_wait_time < max_wait_time:
        rv = client.get("/api/ranking?line_type=BOULDER")
        if rv.status_code == 200:
            res = rv.json
            if (
                len(res) == 1
                and res[0]["user"]["slug"] == "admin-admin"
                and res[0]["top10"] == 23
                and res[0]["top50"] == 23
                and res[0]["totalCount"] == 2
            ):
                break
        time.sleep(wait_time)
        total_wait_time += wait_time
        wait_time *= 2
    assert rv.status_code == 200
    assert len(res) == 1
    assert res[0]["user"]["slug"] == "admin-admin"
    assert res[0]["top10"] == 23
    assert res[0]["top50"] == 23
    assert res[0]["totalCount"] == 2
