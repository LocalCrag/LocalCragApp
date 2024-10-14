from models.area import Area
from models.enums.map_marker_type_enum import MapMarkerType
from models.file import File


def test_successful_create_area(client, moderator_token):
    any_file = File.query.first()

    area_data = {
        "name": "Kreuzfels",
        "description": "Super Bereich",
        "shortDescription": "Super Bereich Kurz",
        "mapMarkers": [
            {
                "lat": 12.13,
                "lng": 42.42,
                "type": MapMarkerType.AREA.value,
                "name": None,
                "description": None,
            }
        ],
        "portraitImage": str(any_file.id),
        "secret": False,
    }

    rv = client.post("/api/sectors/schattental/areas", token=moderator_token, json=area_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["name"] == "Kreuzfels"
    assert res["slug"] == "kreuzfels"
    assert res["description"] == "Super Bereich"
    assert res["shortDescription"] == "Super Bereich Kurz"
    assert res["mapMarkers"][0]["lat"] == 12.13
    assert res["mapMarkers"][0]["lng"] == 42.42
    assert res["mapMarkers"][0]["type"] == "AREA"
    assert res["secret"] == False
    assert res["ascentCount"] == 0
    assert res["portraitImage"]["id"] == str(any_file.id)
    assert res["id"] is not None


def test_create_area_invalid_lat(client, moderator_token):
    area_data = {
        "name": "Kreuzfels",
        "description": "Super Bereich",
        "shortDescription": "Super Bereich Kurz",
        "mapMarkers": [
            {
                "lat": -95,
                "lng": 42.42,
                "type": MapMarkerType.AREA.value,
                "name": None,
                "description": None,
            }
        ],
        "portraitImage": "6137f55a-6201-45ab-89c5-6e9c29739d61",
    }

    rv = client.post("/api/sectors/schattental/areas", token=moderator_token, json=area_data)
    assert rv.status_code == 400


def test_create_area_invalid_lng(client, moderator_token):
    area_data = {
        "name": "Kreuzfels",
        "description": "Super Bereich",
        "shortDescription": "Super Bereich Kurz",
        "mapMarkers": [
            {
                "lat": 42.42,
                "lng": 190.9,
                "type": MapMarkerType.AREA.value,
                "name": None,
                "description": None,
            }
        ],
        "portraitImage": "6137f55a-6201-45ab-89c5-6e9c29739d61",
    }

    rv = client.post("/api/sectors/schattental/areas", token=moderator_token, json=area_data)
    assert rv.status_code == 400


def test_successful_get_areas(client):
    rv = client.get("/api/sectors/schattental/areas")
    assert rv.status_code == 200
    res = rv.json

    areas: list[Area] = Area.query.all()
    assert len(res) == len(areas)

    areas.sort(key=lambda area: area.id)
    res.sort(key=lambda area: area["id"])

    for r, a in zip(res, areas):
        assert r["id"] == str(a.id)
        assert r["slug"] == a.slug
        assert r["name"] == a.name
        assert r["shortDescription"] == a.short_description
        assert r["orderIndex"] == a.order_index
        assert r["secret"] == a.secret
        if a.portrait_image_id is not None:
            assert r["portraitImage"]["id"] == a.portrait_image_id
        else:
            assert r["portraitImage"] is None


def test_successful_get_area(client):
    area = Area.find_by_slug("dritter-block-von-links")

    rv = client.get("/api/areas/dritter-block-von-links")
    assert rv.status_code == 200
    res = rv.json
    assert res["id"] == str(area.id)
    assert res["slug"] == area.slug
    assert res["name"] == area.name
    assert res["description"] == area.description
    assert res["shortDescription"] == area.short_description
    assert res["mapMarkers"][0]["lat"] == area.map_markers[0].lat
    assert res["mapMarkers"][0]["lng"] == area.map_markers[0].lng
    assert res["secret"] == area.secret
    assert res["portraitImage"] is None or res["portraitImage"]["id"] == area.portrait_image_id


def test_get_deleted_area(client):
    rv = client.get("/api/areas/bereich-existiert-nicht-mehr")
    assert rv.status_code == 404
    res = rv.json
    assert res["message"] == "ENTITY_NOT_FOUND"


def test_successful_delete_area(client, moderator_token):
    rv = client.delete("/api/areas/dritter-block-von-links", token=moderator_token)
    assert rv.status_code == 204


def test_successful_edit_area(client, moderator_token):
    area_data = {
        "name": "Vierter Block von rechts",
        "description": "Test edit",
        "shortDescription": "Test edit short",
        "mapMarkers": [
            {
                "lat": 42.1,
                "lng": 42.2,
                "type": MapMarkerType.AREA.value,
                "name": None,
                "description": None,
            }
        ],
        "portraitImage": None,
        "secret": False,
    }

    rv = client.put("/api/areas/dritter-block-von-links", token=moderator_token, json=area_data)
    assert rv.status_code == 200

    res = rv.json
    assert res["name"] == "Vierter Block von rechts"
    assert res["slug"] == "vierter-block-von-rechts"
    assert res["description"] == "Test edit"
    assert res["shortDescription"] == "Test edit short"
    assert res["mapMarkers"][0]["lat"] == 42.1
    assert res["mapMarkers"][0]["lng"] == 42.2
    assert res["ascentCount"] == 1
    assert res["portraitImage"] == None
    assert res["secret"] == False
    assert res["id"] is not None


def test_successful_order_areas(client, moderator_token):
    areas = Area.query.order_by(Area.order_index).all()

    rv = client.get("/api/sectors/schattental/areas")
    assert rv.status_code == 200
    res = rv.json
    assert res[0]["id"] == str(areas[0].id)
    assert res[0]["orderIndex"] == 0
    assert res[1]["id"] == str(areas[1].id)
    assert res[1]["orderIndex"] == 1

    new_order = {
        str(areas[0].id): 1,
        str(areas[1].id): 0,
    }
    rv = client.put("/api/sectors/schattental/areas/update-order", token=moderator_token, json=new_order)
    assert rv.status_code == 200

    rv = client.get("/api/sectors/schattental/areas")
    assert rv.status_code == 200
    res = rv.json
    assert res[0]["id"] == str(areas[1].id)
    assert res[0]["orderIndex"] == 0
    assert res[1]["id"] == str(areas[0].id)
    assert res[1]["orderIndex"] == 1


def test_successful_get_area_grades(client):
    rv = client.get("/api/areas/dritter-block-von-links/grades")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
    assert res[0]["gradeName"] == "1"
    assert res[0]["gradeScale"] == "FB"
    assert res[1]["gradeName"] == "8A"
    assert res[1]["gradeScale"] == "FB"
