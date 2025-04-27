from models.enums.map_marker_type_enum import MapMarkerType
from models.file import File


def test_create_closed_line_in_open_area(client, moderator_token):
    line_data = {
        "name": "Es geheim",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "rating": 5,
        "faYear": 2016,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "morpho": True,
        "lowball": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closed": True,
        "closedReason": "Missgünstige Verbandsgemeinde",
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["closed"] == True
    assert res["closedReason"] == "Missgünstige Verbandsgemeinde"

    # Test, that area, sector and crag are still open

    rv = client.get("/api/areas/dritter-block-von-links")
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == False

    rv = client.get("/api/sectors/schattental")
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == False

    rv = client.get("/api/crags/brione")
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == False


def test_change_crag_to_closed_then_create_open_line_in_it(client, moderator_token):
    any_file = File.query.first()
    crag_data = {
        "name": "brione",
        "description": "Fodere et scandere. 2",
        "shortDescription": "Fodere et scandere 3.",
        "rules": "Parken nur Samstag und Sonntag 2.",
        "portraitImage": str(any_file.id),
        "mapMarkers": [
            {
                "lat": 12.13,
                "lng": 42.42,
                "type": MapMarkerType.CRAG.value,
                "description": None,
                "name": None,
            }
        ],
        "secret": False,
        "closed": True,
        "closedReason": "Aggressiver Jagdpächter",
        "defaultBoulderScale": None,
        "defaultSportScale": None,
        "defaultTradScale": None,
    }

    rv = client.put("/api/crags/brione", token=moderator_token, json=crag_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == True

    # Test, that sectors, areas and lines are now also closed

    rv = client.get("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == True

    rv = client.get("/api/sectors/oben", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == True

    rv = client.get("/api/areas/dritter-block-von-links", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == True

    rv = client.get("/api/lines/treppe", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == True

    # Create open line, check that parents are now open but siblings still closed

    line_data = {
        "name": "Es geheim",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "rating": 5,
        "faYear": 2016,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "morpho": True,
        "lowball": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closed": False,
        "closedReason": None,
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["closed"] == False

    rv = client.get("/api/areas/dritter-block-von-links", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == False

    rv = client.get("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == False

    rv = client.get("/api/crags/brione", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == False

    rv = client.get("/api/crags/chironico", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == False  # Was open all the time!

    rv = client.get("/api/sectors/oben", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == True

    rv = client.get("/api/areas/noch-ein-bereich", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == True

    rv = client.get("/api/lines/treppe", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == True


# Test that creating a closed line in a closed area doesn't change the closed state of it's parents
def test_secret_property_doesnt_change(client, moderator_token):
    any_file = File.query.first()
    # First make crag secret...
    crag_data = {
        "name": "Glees 2",
        "description": "Fodere et scandere. 2",
        "shortDescription": "Fodere et scandere 3.",
        "rules": "Parken nur Samstag und Sonntag 2.",
        "portraitImage": str(any_file.id),
        "mapMarkers": [
            {
                "lat": 12.13,
                "lng": 42.42,
                "type": MapMarkerType.CRAG.value,
                "description": None,
                "name": None,
            }
        ],
        "secret": False,
        "closed": True,
        "closedReason": "Naturschutzgebiet",
        "defaultBoulderScale": None,
        "defaultSportScale": None,
        "defaultTradScale": None,
    }

    rv = client.put("/api/crags/brione", token=moderator_token, json=crag_data)
    assert rv.status_code == 200

    # Add a closed line
    line_data = {
        "name": "Es geheim",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "rating": 5,
        "faYear": 2016,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "morpho": True,
        "lowball": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closed": True,
        "closedReason": "Privatgrund",
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["closed"] == True

    # Test, that area, sector and crag are still closed

    rv = client.get("/api/areas/dritter-block-von-links", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == True

    rv = client.get("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == True

    rv = client.get("/api/crags/glees-2", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] == True
