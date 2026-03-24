from sqlalchemy import text

from extensions import db


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
