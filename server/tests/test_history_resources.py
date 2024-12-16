from models.history_item import HistoryItem


def test_successful_add_and_delete_history(client, moderator_token):
    history_items_before: list[HistoryItem] = HistoryItem.query.all()
    area_data = {
        "name": "Kreuzfels",
        "description": "Super Bereich",
        "shortDescription": "Super Bereich Kurz",
        "mapMarkers": [],
        "portraitImage": None,
        "secret": False,
    }
    rv = client.post("/api/sectors/schattental/areas", token=moderator_token, json=area_data)
    assert rv.status_code == 201
    rv = client.get("/api/history?page=1&per_page=1000", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == len(history_items_before) + 1

    rv = client.delete("/api/areas/kreuzfels", token=moderator_token)
    assert rv.status_code == 204
    rv = client.get("/api/history?page=1&per_page=1000", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == len(history_items_before)


def test_successful_change_value_history(client, moderator_token):
    history_items_before: list[HistoryItem] = HistoryItem.query.all()
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "gradeName": "7B+",
        "gradeScale": "FB",
        "type": "BOULDER",
        "rating": 5,
        "faYear": 2016,
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
    }

    rv = client.put("/api/lines/treppe", token=moderator_token, json=line_data)
    assert rv.status_code == 200
    rv = client.get("/api/history?page=1&per_page=1000", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["items"][0]["oldValue"] != res["items"][0]["newValue"]
