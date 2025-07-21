from models.crag import Crag
from models.enums.map_marker_type_enum import MapMarkerType
from models.file import File
from models.sector import Sector


def test_successful_create_sector(client, moderator_token):
    any_file = File.query.first()
    sector_data = {
        "name": "Kruzifix",
        "description": "Der Klassikersektor",
        "shortDescription": "Classic.",
        "portraitImage": str(any_file.id),
        "mapMarkers": [
            {
                "lat": 12.13,
                "lng": 42.42,
                "type": MapMarkerType.SECTOR.value,
                "name": None,
                "description": None,
            }
        ],
        "rules": "test rules",
        "secret": False,
        "closed": False,
        "closedReason": None,
        "defaultBoulderScale": None,
        "defaultSportScale": "UIAA",
        "defaultTradScale": None,
    }

    rv = client.post("/api/crags/brione/sectors", token=moderator_token, json=sector_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["name"] == "Kruzifix"
    assert res["slug"] == "kruzifix"
    assert res["description"] == "Der Klassikersektor"
    assert res["shortDescription"] == "Classic."
    assert res["portraitImage"]["id"] == str(any_file.id)
    assert res["id"] is not None
    assert res["mapMarkers"][0]["lat"] == 12.13
    assert res["mapMarkers"][0]["lng"] == 42.42
    assert res["ascentCount"] == 0
    assert res["secret"] is False
    assert res["rules"] == "test rules"
    assert res["closed"] is False
    assert res["closedReason"] is None
    assert res["defaultBoulderScale"] is None
    assert res["defaultSportScale"] == "UIAA"
    assert res["defaultTradScale"] is None


def test_successful_get_sectors(client):
    sectors = Sector.query.filter_by(crag_id=Crag.get_id_by_slug("brione")).order_by(Sector.order_index).all()

    rv = client.get("/api/crags/brione/sectors")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == len(sectors)
    for r, s in zip(res, sectors):
        assert r["id"] == str(s.id)
        assert r["slug"] == s.slug
        assert r["name"] == s.name
        assert r["shortDescription"] == s.short_description
        assert r["portraitImage"] is None or r["portraitImage"]["id"] == s.portrait_image_id
        assert r["orderIndex"] == s.order_index
        assert r["secret"] == s.secret
        assert r["closed"] == s.closed
        assert r["closedReason"] == s.closed_reason


def test_successful_get_sector(client):
    rv = client.get("/api/sectors/schattental")
    assert rv.status_code == 200
    res = rv.json
    assert isinstance(res["id"], str)
    assert res["name"] == "Schattental"
    assert res["slug"] == "schattental"
    assert res["ascentCount"] == 1
    assert res["portraitImage"] is None
    assert res["description"] == "<p>Lange Beschreibung zum Schattental</p>"
    assert res["shortDescription"] == "Kurze Beschreibung zum Schattental"
    assert len(res["mapMarkers"]) == 0
    assert res["rules"] is None
    assert res["secret"] is False
    assert res["closed"] is False
    assert res["closedReason"] is None
    assert res["defaultBoulderScale"] is None
    assert res["defaultSportScale"] is None
    assert res["defaultTradScale"] is None


def test_get_deleted_sector(client):
    rv = client.get("/api/crags/mordor")
    assert rv.status_code == 404
    res = rv.json
    assert res["message"] == "ENTITY_NOT_FOUND"


def test_successful_delete_sector(client, moderator_token):
    rv = client.delete("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 204


def test_successful_edit_sector(client, moderator_token):
    any_file = File.query.first()
    sector_data = {
        "name": "Romani",
        "description": "Test edit",
        "shortDescription": "Test",
        "portraitImage": str(any_file.id),
        "mapMarkers": [
            {
                "lat": 42.1,
                "lng": 42.2,
                "type": MapMarkerType.SECTOR.value,
                "name": None,
                "description": None,
            }
        ],
        "rules": "test rules",
        "secret": False,
        "closed": False,
        "closedReason": None,
        "defaultBoulderScale": "FB",
        "defaultSportScale": None,
        "defaultTradScale": None,
    }

    rv = client.put("/api/sectors/schattental", token=moderator_token, json=sector_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["name"] == "Romani"
    assert res["slug"] == "romani"
    assert res["description"] == "Test edit"
    assert res["shortDescription"] == "Test"
    assert res["portraitImage"]["id"] == str(any_file.id)
    assert res["id"] is not None
    assert res["mapMarkers"][0]["lat"] == 42.1
    assert res["mapMarkers"][0]["lng"] == 42.2
    assert res["ascentCount"] == 1
    assert res["secret"] is False
    assert res["rules"] == "test rules"
    assert res["closed"] is False
    assert res["closedReason"] is None
    assert res["defaultBoulderScale"] == "FB"
    assert res["defaultSportScale"] is None
    assert res["defaultTradScale"] is None


def test_successful_order_sectors(client, moderator_token):
    sectors = Sector.query.filter_by(crag_id=Crag.get_id_by_slug("brione")).order_by(Sector.order_index).all()

    rv = client.get("/api/crags/brione/sectors")
    assert rv.status_code == 200
    res = rv.json
    assert res[0]["id"] == str(sectors[0].id)
    assert res[0]["orderIndex"] == 0
    assert res[1]["id"] == str(sectors[1].id)
    assert res[1]["orderIndex"] == 1

    new_order = {
        str(sectors[0].id): 1,
        str(sectors[1].id): 0,
    }
    rv = client.put("/api/crags/brione/sectors/update-order", token=moderator_token, json=new_order)
    assert rv.status_code == 200

    rv = client.get("/api/crags/brione/sectors")
    assert rv.status_code == 200
    res = rv.json
    assert res[0]["id"] == str(sectors[1].id)
    assert res[0]["orderIndex"] == 0
    assert res[1]["id"] == str(sectors[0].id)
    assert res[1]["orderIndex"] == 1


def test_successful_get_sector_grades(client):
    rv = client.get("/api/sectors/schattental/grades")
    assert rv.status_code == 200
    res = rv.json
    assert res["BOULDER"]["FB"] == {"1": 1, "22": 1}
