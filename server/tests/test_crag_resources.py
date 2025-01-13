from models.crag import Crag
from models.enums.map_marker_type_enum import MapMarkerType
from models.file import File


def test_successful_create_crag(client, moderator_token):
    any_file_id = str(File.query.first().id)

    crag_data = {
        "name": "Glees",
        "description": "Fodere et scandere.",
        "shortDescription": "Fodere et scandere 2.",
        "rules": "Parken nur Samstag und Sonntag.",
        "portraitImage": any_file_id,
        "mapMarkers": [
            {
                "lat": 12.13,
                "lng": 42.42,
                "type": MapMarkerType.CRAG.value,
                "name": None,
                "description": None,
            }
        ],
        "secret": False,
        "defaultBoulderScale": None,
        "defaultSportScale": "UIAA",
        "defaultTradScale": None,
    }

    rv = client.post("/api/crags", token=moderator_token, json=crag_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["name"] == "Glees"
    assert res["slug"] == "glees"
    assert res["description"] == "Fodere et scandere."
    assert res["shortDescription"] == "Fodere et scandere 2."
    assert res["rules"] == "Parken nur Samstag und Sonntag."
    assert res["mapMarkers"][0]["lat"] == 12.13
    assert res["mapMarkers"][0]["lng"] == 42.42
    assert res["portraitImage"]["id"] == any_file_id
    assert res["id"] is not None
    assert res["ascentCount"] == 0
    assert res["secret"] == False
    assert res["defaultBoulderScale"] is None
    assert res["defaultSportScale"] == "UIAA"
    assert res["defaultTradScale"] is None


def test_successful_get_crags(client):
    crags = Crag.query.order_by(Crag.order_index).all()

    rv = client.get("/api/crags")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == len(crags)
    for r, crag in zip(res, crags):
        assert r["id"] == str(crag.id)
        assert r["slug"] == crag.slug
        assert r["name"] == crag.name
        assert r["orderIndex"] == crag.order_index
        assert r["secret"] == crag.secret
        assert r["shortDescription"] == crag.short_description
        assert r["portraitImage"] is None or r["portraitImage"]["id"] == crag.portrait_image_id


def test_successful_get_crag(client):
    crag = Crag.find_by_slug("brione")

    rv = client.get("/api/crags/brione")
    assert rv.status_code == 200
    res = rv.json
    assert res["id"] == str(crag.id)
    assert res["name"] == crag.name
    assert res["slug"] == crag.slug
    assert res["orderIndex"] == crag.order_index
    assert res["portraitImage"] is crag.portrait_image_id or res["portraitImage"]["id"] == crag.portrait_image_id
    assert res["description"] == crag.description
    assert res["shortDescription"] == crag.short_description
    assert res["rules"] == crag.rules
    assert len(res["mapMarkers"]) == len(crag.map_markers)
    assert res["secret"] == crag.secret
    assert res["defaultBoulderScale"] is None
    assert res["defaultSportScale"] is None
    assert res["defaultTradScale"] is None


def test_get_deleted_crag(client):
    rv = client.get("/api/crags/hohenfels")
    assert rv.status_code == 404
    res = rv.json
    assert res["message"] == "ENTITY_NOT_FOUND"


def test_successful_delete_crag(client, moderator_token):
    rv = client.delete("/api/crags/brione", token=moderator_token)
    assert rv.status_code == 204


def test_successful_edit_crag(client, moderator_token):
    any_file_id = str(File.query.first().id)

    crag_data = {
        "name": "Glees 2",
        "description": "Fodere et scandere. 2",
        "shortDescription": "Fodere et scandere 3.",
        "rules": "Parken nur Samstag und Sonntag 2.",
        "portraitImage": any_file_id,
        "mapMarkers": [
            {
                "lat": 42.1,
                "lng": 42.2,
                "type": MapMarkerType.CRAG.value,
                "name": None,
                "description": None,
            }
        ],
        "secret": False,
        "defaultBoulderScale": "FB",
        "defaultSportScale": None,
        "defaultTradScale": None,
    }

    rv = client.put("/api/crags/brione", token=moderator_token, json=crag_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["name"] == "Glees 2"
    assert res["slug"] == "glees-2"
    assert res["description"] == "Fodere et scandere. 2"
    assert res["shortDescription"] == "Fodere et scandere 3."
    assert res["rules"] == "Parken nur Samstag und Sonntag 2."
    assert res["mapMarkers"][0]["lat"] == 42.1
    assert res["mapMarkers"][0]["lng"] == 42.2
    assert res["orderIndex"] == 0
    assert res["ascentCount"] == 1
    assert res["secret"] == False
    assert res["id"] is not None
    assert res["defaultBoulderScale"] == "FB"
    assert res["defaultSportScale"] is None
    assert res["defaultTradScale"] is None


def test_successful_order_crags(client, moderator_token):
    crags = Crag.query.order_by(Crag.order_index).all()

    rv = client.get("/api/crags")
    assert rv.status_code == 200
    res = rv.json
    assert res[0]["id"] == str(crags[0].id)
    assert res[0]["orderIndex"] == 0
    assert res[1]["id"] == str(crags[1].id)
    assert res[1]["orderIndex"] == 1

    new_order = {
        str(crags[0].id): 1,
        str(crags[1].id): 0,
    }
    rv = client.put("/api/crags/update-order", token=moderator_token, json=new_order)
    assert rv.status_code == 200

    rv = client.get("/api/crags")
    assert rv.status_code == 200
    res = rv.json
    assert res[0]["id"] == str(crags[1].id)
    assert res[0]["orderIndex"] == 0
    assert res[1]["id"] == str(crags[0].id)
    assert res[1]["orderIndex"] == 1


def test_order_crags_wrong_number_of_items(client, moderator_token):
    crags = Crag.query.order_by(Crag.order_index).all()

    new_order = {
        str(crags[0].id): 1,
        str(crags[1].id): 0,
        str(crags[1].id): 2,
    }
    rv = client.put("/api/crags/update-order", token=moderator_token, json=new_order)
    assert rv.status_code == 400


def test_order_crags_bad_indexes(client, moderator_token):
    crags = Crag.query.order_by(Crag.order_index).all()

    new_order = {
        str(crags[0].id): 2,
        str(crags[1].id): 0,
    }
    rv = client.put("/api/crags/update-order", token=moderator_token, json=new_order)
    assert rv.status_code == 400


def test_successful_get_crag_grades(client):
    rv = client.get("/api/crags/brione/grades")
    assert rv.status_code == 200
    res = rv.json
    assert res["BOULDER"]["FB"] == {"1": 1, "22": 1}
