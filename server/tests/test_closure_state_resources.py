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
