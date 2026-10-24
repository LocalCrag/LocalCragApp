from extensions import db
from models.enums.publication_status_enum import PublicationStatusEnum
from models.line import Line
from tests.test_suggestions import _create_draft_line


def test_get_area_closure_state(client):
    rv = client.get("/api/areas/shark-attack/closure-state")
    assert rv.status_code == 200
    assert rv.json["closed"] is False
    assert rv.json["closureIsPermanent"] is False
    assert rv.json["closedReasons"] == []


def test_get_sector_closure_state(client):
    rv = client.get("/api/sectors/pampelmousse/closure-state")
    assert rv.status_code == 200
    assert "closed" in rv.json


def test_get_crag_closure_state(client):
    rv = client.get("/api/crags/brione/closure-state")
    assert rv.status_code == 200
    assert "closed" in rv.json


def test_get_line_closure_state(client):
    rv = client.get("/api/lines/the-vessel/closure-state")
    assert rv.status_code == 200
    assert "closed" in rv.json
    assert "closedReasons" in rv.json


def test_unpublished_line_closure_state_matches_line_visibility(client, member_token, user_token, moderator_token):
    created = _create_draft_line(client, member_token, "Hidden Closure")
    assert created.status_code == 201, created.text
    slug = created.json["slug"]

    assert client.get(f"/api/lines/{slug}/closure-state").status_code == 404
    assert client.get(f"/api/lines/{slug}/closure-state", token=user_token).status_code == 404
    assert client.get(f"/api/lines/{slug}/closure-state", token=member_token).status_code == 200
    assert client.get(f"/api/lines/{slug}/closure-state", token=moderator_token).status_code == 200

    line = Line.find_by_slug(slug)
    line.publication_status = PublicationStatusEnum.REJECTED
    db.session.commit()
    assert client.get(f"/api/lines/{slug}/closure-state", token=member_token).status_code == 404
    assert client.get(f"/api/lines/{slug}/closure-state", token=moderator_token).status_code == 404

    published = Line.find_by_slug("the-vessel")
    published.publication_status = PublicationStatusEnum.ARCHIVED
    db.session.commit()
    archived = client.get("/api/lines/the-vessel/closure-state")
    assert archived.status_code == 200
    assert "closed" in archived.json
