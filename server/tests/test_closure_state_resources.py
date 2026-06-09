def test_get_area_closure_state(client, moderator_token):
    rv = client.get(
        "/api/areas/dritter-block-von-links/closure-state",
        token=moderator_token,
    )
    assert rv.status_code == 200
    assert rv.json["closed"] is False
    assert rv.json["closedReason"] is None


def test_get_sector_closure_state(client, moderator_token):
    rv = client.get(
        "/api/sectors/schattental/closure-state",
        token=moderator_token,
    )
    assert rv.status_code == 200
    assert "closed" in rv.json


def test_get_crag_closure_state(client, moderator_token):
    rv = client.get(
        "/api/crags/brione/closure-state",
        token=moderator_token,
    )
    assert rv.status_code == 200
    assert "closed" in rv.json
