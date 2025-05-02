from models.line import Line


def test_successful_create_line(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "color": "#334433",
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
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
    assert res["name"] == "Es"
    assert res["slug"] == "es"
    assert res["description"] == "Super Boulder"
    assert res["videos"][0]["url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert res["color"] == "#334433"
    assert res["authorGradeValue"] == 19
    assert "userGradeValue" in res
    assert res["gradeScale"] == "FB"
    assert res["type"] == "BOULDER"
    assert res["authorRating"] == 5
    assert "userRating" in res
    assert res["ascentCount"] == 0
    assert res["faYear"] == 2016
    assert res["faName"] == "Dave Graham"
    assert res["startingPosition"] == "FRENCH"
    assert res["eliminate"] == True
    assert res["traverse"] == True
    assert res["highball"] == True
    assert res["lowball"] == True
    assert res["morpho"] == True
    assert res["noTopout"] == True
    assert res["badDropzone"] == True
    assert res["childFriendly"] == True
    assert res["roof"] == True
    assert res["slab"] == True
    assert res["vertical"] == True
    assert res["overhang"] == True
    assert res["athletic"] == True
    assert res["technical"] == True
    assert res["endurance"] == True
    assert res["cruxy"] == True
    assert res["dyno"] == True
    assert res["jugs"] == True
    assert res["sloper"] == True
    assert res["crimps"] == True
    assert res["pockets"] == True
    assert res["pinches"] == True
    assert res["crack"] == True
    assert res["dihedral"] == True
    assert res["compression"] == True
    assert res["arete"] == True
    assert res["mantle"] == True
    assert res["secret"] == False
    assert res["id"] is not None
    assert len(res["linePaths"]) == 0
    assert res["closed"] == False
    assert res["closedReason"] is None


def test_successful_create_line_with_project_status(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": -1,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
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
    assert res["name"] == "Es"
    assert res["slug"] == "es"
    assert res["description"] == "Super Boulder"
    assert res["videos"][0]["url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert res["videos"][0]["title"] == "Video"
    assert res["authorGradeValue"] == -1
    assert res["gradeScale"] == "FB"
    assert res["type"] == "BOULDER"
    assert res["authorRating"] == 5
    assert res["ascentCount"] == 0
    assert res["faYear"] == None  # Should be set to None automatically for projects!
    assert res["faName"] == None  # Should be set to None automatically for projects!
    assert res["startingPosition"] == "FRENCH"
    assert res["eliminate"] == True
    assert res["traverse"] == True
    assert res["highball"] == True
    assert res["morpho"] == True
    assert res["lowball"] == True
    assert res["noTopout"] == True
    assert res["badDropzone"] == True
    assert res["childFriendly"] == True
    assert res["roof"] == True
    assert res["slab"] == True
    assert res["vertical"] == True
    assert res["overhang"] == True
    assert res["athletic"] == True
    assert res["technical"] == True
    assert res["endurance"] == True
    assert res["cruxy"] == True
    assert res["dyno"] == True
    assert res["jugs"] == True
    assert res["sloper"] == True
    assert res["crimps"] == True
    assert res["pockets"] == True
    assert res["pinches"] == True
    assert res["crack"] == True
    assert res["dihedral"] == True
    assert res["compression"] == True
    assert res["arete"] == True
    assert res["mantle"] == True
    assert res["secret"] == False
    assert res["id"] is not None
    assert len(res["linePaths"]) == 0
    assert res["closed"] == False
    assert res["closedReason"] is None


def test_create_line_invalid_fa_year(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 9000,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
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
    assert rv.status_code == 400


def test_create_line_invalid_rating(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 6,
        "faYear": 2014,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
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
    assert rv.status_code == 400


def test_create_line_invalid_video_url(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "sdfsdfsdf", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2014,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
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
    assert rv.status_code == 400


def test_create_line_invalid_grade_value(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 42,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2000,
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
    assert rv.status_code == 400


def test_create_line_invalid_grade_scale_for_line_type(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "TRAD",
        "authorRating": 5,
        "faYear": 2000,
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
    assert rv.status_code == 400


def test_create_line_invalid_grade_scale(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "TRESGDFGD",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2000,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
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
    assert rv.status_code == 400


def test_create_line_invalid_line_type(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "WEIRD",
        "authorRating": 5,
        "faYear": 2000,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
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
    assert rv.status_code == 400


def test_create_line_invalid_line_starting_position(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2000,
        "faName": "Dave Graham",
        "startingPosition": "PRE_CLIPPED",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
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
    assert rv.status_code == 400


def test_create_line_invalid_video_payload(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            }
        ],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "WEIRD",
        "authorRating": 5,
        "faYear": 2000,
        "faName": "Dave Graham",
        "startingPosition": "SIT",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
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
    assert rv.status_code == 400


def test_create_line_invalid_color(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "color": "#0x3120",
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
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
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_successful_get_lines(client):
    lines = Line.query.all()

    rv = client.get("/api/lines")
    assert rv.status_code == 200
    res = rv.json["items"]
    assert len(res) == len(lines)
    for r, line in zip(sorted(res, key=lambda r: r["id"]), sorted(lines, key=lambda l: str(l.id))):
        assert r["id"] == str(line.id)
        assert r["slug"] == line.slug
        assert r["name"] == line.name
        assert r["ascentCount"] == line.ascent_count
        assert r["secret"] == line.secret
        assert r["color"] == line.color
        assert len(r["linePaths"]) == len(line.line_paths)
        assert r["closed"] == line.closed
        assert r["closedReason"] == line.closed_reason


def test_successful_get_line(client):
    rv = client.get("/api/lines/super-spreader")
    assert rv.status_code == 200
    res = rv.json
    assert res["name"] == "Super-Spreader"
    assert res["slug"] == "super-spreader"
    assert res["description"] == "<p>Geiler Kühlschrankboulder!</p>"
    assert res["videos"][0]["url"] == "https://www.youtube.com/watch?v=8A_9oHuTkQA"
    assert res["color"] is None
    assert res["authorGradeValue"] == 22
    assert "userGradeValue" in res
    assert res["gradeScale"] == "FB"
    assert res["type"] == "BOULDER"
    assert res["authorRating"] == 5
    assert res["ascentCount"] == 1
    assert res["faYear"] == 2024
    assert res["faName"] == "Felix Engelmann"
    assert res["startingPosition"] == "SIT"
    assert res["eliminate"] == False
    assert res["traverse"] == False
    assert res["highball"] == False
    assert res["lowball"] == False
    assert res["morpho"] == False
    assert res["noTopout"] == True
    assert res["badDropzone"] == False
    assert res["childFriendly"] == False
    assert res["roof"] == False
    assert res["slab"] == False
    assert res["vertical"] == False
    assert res["overhang"] == True
    assert res["athletic"] == True
    assert res["technical"] == False
    assert res["endurance"] == False
    assert res["cruxy"] == True
    assert res["dyno"] == False
    assert res["jugs"] == False
    assert res["sloper"] == True
    assert res["crimps"] == False
    assert res["pockets"] == False
    assert res["pinches"] == False
    assert res["crack"] == False
    assert res["dihedral"] == False
    assert res["compression"] == True
    assert res["arete"] == False
    assert res["mantle"] == False
    assert res["secret"] == False
    assert res["id"] is not None
    assert len(res["linePaths"]) == 2
    assert isinstance(res["linePaths"][0]["topoImage"]["id"], str)
    assert res["linePaths"][0]["orderIndex"] == 0
    assert res["linePaths"][0]["topoImage"]["orderIndex"] == 0
    assert res["closed"] == False
    assert res["closedReason"] is None


def test_get_deleted_line(client):
    rv = client.get("/api/lines/linie-existiert-nicht-mehr")
    assert rv.status_code == 404
    res = rv.json
    assert res["message"] == "ENTITY_NOT_FOUND"


def test_successful_delete_line(client, moderator_token):
    rv = client.delete("/api/lines/super-spreader", token=moderator_token)
    assert rv.status_code == 204


def test_successful_edit_line(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "color": "#123456",
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
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
        "closed": False,
        "closedReason": None,
    }

    rv = client.put("/api/lines/treppe", token=moderator_token, json=line_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["name"] == "Es"
    assert res["slug"] == "es"
    assert res["description"] == "Super Boulder"
    assert res["videos"][0]["url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert res["color"] == "#123456"
    assert res["authorGradeValue"] == 19
    assert res["gradeScale"] == "FB"
    assert res["type"] == "BOULDER"
    assert res["authorRating"] == 5
    assert res["ascentCount"] == 0
    assert res["faYear"] == 2016
    assert res["faName"] == "Dave Graham"
    assert res["startingPosition"] == "STAND"
    assert res["eliminate"] == True
    assert res["traverse"] == True
    assert res["highball"] == True
    assert res["lowball"] == True
    assert res["morpho"] == True
    assert res["noTopout"] == True
    assert res["badDropzone"] == True
    assert res["childFriendly"] == True
    assert res["roof"] == True
    assert res["slab"] == True
    assert res["vertical"] == True
    assert res["overhang"] == True
    assert res["athletic"] == True
    assert res["technical"] == True
    assert res["endurance"] == True
    assert res["cruxy"] == True
    assert res["dyno"] == True
    assert res["jugs"] == True
    assert res["sloper"] == True
    assert res["crimps"] == True
    assert res["pockets"] == True
    assert res["pinches"] == True
    assert res["crack"] == True
    assert res["dihedral"] == True
    assert res["compression"] == True
    assert res["arete"] == True
    assert res["mantle"] == True
    assert res["secret"] == False
    assert res["id"] is not None
    assert len(res["linePaths"]) == 1
    assert isinstance(res["linePaths"][0]["topoImage"]["id"], str)
    assert res["linePaths"][0]["orderIndex"] == 1
    assert res["linePaths"][0]["topoImage"]["orderIndex"] == 0
    assert res["closed"] == False
    assert res["closedReason"] is None


def test_edit_line_change_grade_to_project_if_line_has_ascents(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "gradeValue": -1,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faName": "Dave Graham",
        "startingPosition": "STAND",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
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

    rv = client.put("/api/lines/super-spreader", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_successful_get_lines_for_line_editor(client):
    rv = client.get("/api/lines/for-line-editor/dritter-block-von-links")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
