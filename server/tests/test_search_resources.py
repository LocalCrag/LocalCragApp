from sqlalchemy import text

from extensions import db
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.recent_search import RecentSearch
from models.secret_topo_entity import SecretTopoEntity
from models.user import User


def _enable_fuzzystrmatch():
    db.session.execute(text('create extension if not exists "fuzzystrmatch";'))


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
    line_id = str(Line.get_id_by_slug("the-vessel"))
    crag_id = str(Crag.get_id_by_slug("brione"))
    rv = client.post(
        "/api/account/recent-searches",
        token=member_token,
        json={"objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 204, rv.text

    rv = client.post(
        "/api/account/recent-searches",
        token=member_token,
        json={"objectType": "Crag", "objectId": crag_id},
    )
    assert rv.status_code == 204, rv.text

    # Ensure deterministic entries exist for this test.
    rv = client.get("/api/account/recent-searches", token=member_token)
    assert rv.status_code == 200, rv.text
    assert len(rv.json) >= 2
    assert {rv.json[0]["type"], rv.json[1]["type"]} == {"LINE", "CRAG"}


def test_create_recent_search(client, member_token):
    line_id = str(Line.get_id_by_slug("the-vessel"))
    rv = client.post(
        "/api/account/recent-searches",
        token=member_token,
        json={"objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 204, rv.text

    # Read again
    rv = client.get("/api/account/recent-searches", token=member_token)
    assert rv.status_code == 200, rv.text
    assert len(rv.json) >= 1
    assert rv.json[0]["type"] == "LINE"
    assert rv.json[0]["item"]["id"] == line_id


def test_create_recent_search_rejects_invalid_payload(client, member_token):
    rv = client.post(
        "/api/account/recent-searches",
        token=member_token,
        json={"objectType": "Line"},
    )
    assert rv.status_code == 400, rv.text


def test_secret_line_excluded_from_search_for_anonymous(client, member_token):
    _enable_fuzzystrmatch()
    line = Line.find_by_slug("the-vessel")
    line.secret = True
    db.session.commit()
    assert db.session.get(SecretTopoEntity, line.id) is not None

    rv = client.get("/api/search/vessel?objectType=Line")
    assert rv.status_code == 200
    line_names = [item["item"]["name"] for item in rv.json]
    assert "The Vessel" not in line_names

    rv = client.get("/api/search/vessel?objectType=Line", token=member_token)
    assert rv.status_code == 200
    line_names = [item["item"]["name"] for item in rv.json]
    assert "The Vessel" in line_names


def test_secret_area_excluded_from_search_for_anonymous(client, member_token):
    _enable_fuzzystrmatch()
    area = Area.find_by_slug("shark-attack")
    area.secret = True
    db.session.commit()
    assert db.session.get(SecretTopoEntity, area.id) is not None

    rv = client.get("/api/search/shark?objectType=Area")
    assert rv.status_code == 200
    area_names = [item["item"]["name"] for item in rv.json]
    assert "Shark Attack" not in area_names

    rv = client.get("/api/search/shark?objectType=Area", token=member_token)
    assert rv.status_code == 200
    area_names = [item["item"]["name"] for item in rv.json]
    assert "Shark Attack" in area_names


def test_create_recent_search_rejects_secret_line_for_non_member(client, user_token):
    line = Line.find_by_slug("the-vessel")
    line.secret = True
    db.session.commit()

    rv = client.post(
        "/api/account/recent-searches",
        token=user_token,
        json={"objectType": "Line", "objectId": str(line.id)},
    )
    assert rv.status_code == 400, rv.text


def test_get_recent_searches_hides_secret_entities_for_non_member(client, user_token):
    line = Line.find_by_slug("the-vessel")
    line.secret = True
    db.session.commit()

    user = User.find_by_email("user@localcrag.invalid.org")
    recent_search = RecentSearch()
    recent_search.user_id = user.id
    recent_search.object_type = "Line"
    recent_search.object_id = line.id
    db.session.add(recent_search)
    db.session.commit()

    rv = client.get("/api/account/recent-searches", token=user_token)
    assert rv.status_code == 200, rv.text
    line_ids = [item["item"]["id"] for item in rv.json if item["type"] == "LINE"]
    assert str(line.id) not in line_ids


def test_get_recent_searches_includes_secret_line_for_member(client, member_token):
    line = Line.find_by_slug("the-vessel")
    line.secret = True
    db.session.commit()

    rv = client.post(
        "/api/account/recent-searches",
        token=member_token,
        json={"objectType": "Line", "objectId": str(line.id)},
    )
    assert rv.status_code == 204, rv.text

    rv = client.get("/api/account/recent-searches", token=member_token)
    assert rv.status_code == 200, rv.text
    line_ids = [item["item"]["id"] for item in rv.json if item["type"] == "LINE"]
    assert str(line.id) in line_ids


def test_rock_explorer_feature_searchable_for_member(client, member_token, user_token):
    _enable_fuzzystrmatch()
    rv = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json={
            "title": "Searchable Prospect Ridge",
            "description": None,
            "potential": "HIGH",
            "geometry": {"type": "Point", "coordinates": [8.1, 50.2]},
            "topoLinks": [],
        },
    )
    assert rv.status_code == 201, rv.text
    feature_id = rv.json["id"]

    rv = client.get("/api/search/Prospect%20Ridge?objectType=RockExplorerFeature", token=member_token)
    assert rv.status_code == 200, rv.text
    assert any(
        item["type"] == "ROCK_EXPLORER_FEATURE"
        and item["item"]["id"] == feature_id
        and item["item"]["title"] == "Searchable Prospect Ridge"
        for item in rv.json
    )

    rv = client.get("/api/search/Prospect%20Ridge?objectType=RockExplorerFeature", token=user_token)
    assert rv.status_code == 200, rv.text
    assert all(item["type"] != "ROCK_EXPLORER_FEATURE" for item in rv.json)

    rv = client.get("/api/search/Prospect%20Ridge?objectType=RockExplorerFeature")
    assert rv.status_code == 200, rv.text
    assert all(item["type"] != "ROCK_EXPLORER_FEATURE" for item in rv.json)


def test_rock_explorer_draft_and_untitled_not_searchable(client, member_token):
    _enable_fuzzystrmatch()
    draft = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json={
            "title": "Hidden Draft Ridge",
            "status": "draft",
            "recordingDeviceId": "device-search-test",
            "geometry": {"type": "Point", "coordinates": [8.2, 50.3]},
            "topoLinks": [],
        },
    )
    assert draft.status_code == 201, draft.text

    untitled = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json={
            "title": None,
            "potential": "LOW",
            "geometry": {"type": "Point", "coordinates": [8.3, 50.4]},
            "topoLinks": [],
        },
    )
    assert untitled.status_code == 201, untitled.text

    rv = client.get("/api/search/Hidden%20Draft%20Ridge?objectType=RockExplorerFeature", token=member_token)
    assert rv.status_code == 200, rv.text
    assert all(item["item"]["id"] != draft.json["id"] for item in rv.json)


def test_create_recent_search_rock_explorer_feature(client, member_token, user_token):
    rv = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json={
            "title": "Recent Search Feature",
            "potential": "MEDIUM",
            "geometry": {"type": "Point", "coordinates": [8.4, 50.5]},
            "topoLinks": [],
        },
    )
    assert rv.status_code == 201, rv.text
    feature_id = rv.json["id"]

    rv = client.post(
        "/api/account/recent-searches",
        token=member_token,
        json={"objectType": "RockExplorerFeature", "objectId": feature_id},
    )
    assert rv.status_code == 204, rv.text

    rv = client.get("/api/account/recent-searches", token=member_token)
    assert rv.status_code == 200, rv.text
    assert rv.json[0]["type"] == "ROCK_EXPLORER_FEATURE"
    assert rv.json[0]["item"]["id"] == feature_id

    rv = client.post(
        "/api/account/recent-searches",
        token=user_token,
        json={"objectType": "RockExplorerFeature", "objectId": feature_id},
    )
    assert rv.status_code == 400, rv.text
