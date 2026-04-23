from sqlalchemy import text

from extensions import db
from models.crag import Crag
from models.line import Line


def test_successful_search(client):
    # All other placements for this statement do not seem to work well
    db.session.execute(text('create extension if not exists "fuzzystrmatch";'))

    rv = client.get("/api/search/superspread")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 10
    assert res[0]["type"] == "LINE"
    assert res[0]["item"]["name"] == "Super-Spreader"
    assert isinstance(res[0]["item"]["id"], str)


def test_search_object_type_filter_line(client):
    # All other placements for this statement do not seem to work well
    db.session.execute(text('create extension if not exists "fuzzystrmatch";'))

    rv = client.get("/api/search/superspread?objectType=Line")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) > 0
    assert all(item["type"] == "LINE" for item in res)


def test_search_object_type_invalid_value(client):
    # All other placements for this statement do not seem to work well
    db.session.execute(text('create extension if not exists "fuzzystrmatch";'))

    rv = client.get("/api/search/superspread?objectType=NotAType")
    assert rv.status_code == 400


def test_get_recent_searches(client, member_token):
    line_id = str(Line.get_id_by_slug("treppe"))
    crag_id = str(Crag.get_id_by_slug("brione"))
    rv = client.post(
        "/api/users/account/recent-searches",
        token=member_token,
        json={"objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 204, rv.text

    rv = client.post(
        "/api/users/account/recent-searches",
        token=member_token,
        json={"objectType": "Crag", "objectId": crag_id},
    )
    assert rv.status_code == 204, rv.text

    # Ensure deterministic entries exist for this test.
    rv = client.get("/api/users/account/recent-searches", token=member_token)
    assert rv.status_code == 200, rv.text
    assert len(rv.json) >= 2
    assert {rv.json[0]["type"], rv.json[1]["type"]} == {"LINE", "CRAG"}


def test_create_recent_search(client, member_token):
    line_id = str(Line.get_id_by_slug("treppe"))
    rv = client.post(
        "/api/users/account/recent-searches",
        token=member_token,
        json={"objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 204, rv.text

    # Read again
    rv = client.get("/api/users/account/recent-searches", token=member_token)
    assert rv.status_code == 200, rv.text
    assert len(rv.json) >= 1
    assert rv.json[0]["type"] == "LINE"
    assert rv.json[0]["item"]["id"] == line_id


def test_create_recent_search_rejects_invalid_payload(client, member_token):
    rv = client.post(
        "/api/users/account/recent-searches",
        token=member_token,
        json={"objectType": "Line"},
    )
    assert rv.status_code == 400, rv.text
