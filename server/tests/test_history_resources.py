from models.history_item import HistoryItem


def test_successful_add_and_delete_history(client, moderator_token):
    history_items_before: list[HistoryItem] = HistoryItem.query.all()
    area_data = {
        "name": "Fiona",
        "description": "Great area",
        "shortDescription": "Great area short",
        "mapMarkers": [],
        "portraitImage": None,
        "secret": False,
        "defaultBoulderScale": None,
        "defaultSportScale": None,
        "defaultTradScale": None,
        "blocweatherUrl": None,
        "closureSchedules": [],
    }
    rv = client.post("/api/sectors/pampelmousse/areas", token=moderator_token, json=area_data)
    assert rv.status_code == 201
    rv = client.get("/api/history?page=1&per_page=1000", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == len(history_items_before) + 1

    rv = client.delete("/api/areas/fiona", token=moderator_token)
    assert rv.status_code == 204
    rv = client.get("/api/history?page=1&per_page=1000", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == len(history_items_before)


def test_successful_change_value_history(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "STAND",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "morpho": True,
        "variant": False,
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
        "closureSchedules": [],
    }

    rv = client.put("/api/lines/the-vessel", token=moderator_token, json=line_data)
    assert rv.status_code == 200
    rv = client.get("/api/history?page=1&per_page=1000", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    line_item = res["items"][0]
    assert line_item["oldValue"] != line_item["newValue"]
    assert line_item["objectType"] == "Line"
    assert line_item["object"]["name"] == "Es"
    assert line_item["object"]["slug"] == "es"
    assert line_item["object"]["area"]["name"] == "Shark Attack"
    assert line_item["object"]["area"]["slug"] == "shark-attack"
    assert line_item["object"]["area"]["sector"]["name"] == "Pampelmousse"
    assert line_item["object"]["area"]["sector"]["slug"] == "pampelmousse"
    assert line_item["object"]["area"]["sector"]["crag"]["name"] == "Brione"
    assert line_item["object"]["area"]["sector"]["crag"]["slug"] == "brione"


def test_history_respects_secret_flag(client, moderator_token):
    area_data = {
        "name": "Fiona",
        "description": "Great area",
        "shortDescription": "Great area short",
        "mapMarkers": [],
        "portraitImage": None,
        "secret": True,
        "defaultBoulderScale": None,
        "defaultSportScale": None,
        "defaultTradScale": None,
        "blocweatherUrl": None,
        "closureSchedules": [],
    }
    rv = client.post("/api/sectors/pampelmousse/areas", token=moderator_token, json=area_data)
    assert rv.status_code == 201
    rv = client.get("/api/history?page=1&per_page=1000", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 1
    rv = client.get("/api/history?page=1&per_page=1000")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 0
