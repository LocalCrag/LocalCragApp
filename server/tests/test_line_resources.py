import json

from tests.utils.user_test_util import get_login_headers


def test_successful_create_line(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Video"
            }
        ],
        "gradeName": "7B+",
        "gradeScale": "FB",
        "type": "BOULDER",
        "rating": 5,
        "faYear": 2016,
        "faName": "Dave Graham",
        "startingPosition": 'FRENCH',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['name'] == "Es"
    assert res['slug'] == "es"
    assert res['description'] == "Super Boulder"
    assert res['videos'][0]['url'] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert res['gradeName'] == "7B+"
    assert res['gradeScale'] == "FB"
    assert res['type'] == "BOULDER"
    assert res["rating"] == 5
    assert res["faYear"] == 2016
    assert res["faName"] == "Dave Graham"
    assert res["startingPosition"] == 'FRENCH'
    assert res["eliminate"] == True
    assert res["traverse"] == True
    assert res["highball"] == True
    assert res["noTopout"] == True
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
    assert res['id'] is not None
    assert len(res['linePaths']) == 0

def test_successful_create_line_with_project_status(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Video"
            }
        ],
        "gradeName": "OPEN_PROJECT",
        "gradeScale": "FB",
        "type": "BOULDER",
        "rating": 5,
        "faYear": 2016,
        "faName": "Dave Graham",
        "startingPosition": 'FRENCH',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['name'] == "Es"
    assert res['slug'] == "es"
    assert res['description'] == "Super Boulder"
    assert res['videos'][0]['url'] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert res['videos'][0]['title'] == "Video"
    assert res['gradeName'] == "OPEN_PROJECT"
    assert res['gradeScale'] == "FB"
    assert res['type'] == "BOULDER"
    assert res["rating"] == None # Should be set to None automatically for projects!
    assert res["faYear"] == None # Should be set to None automatically for projects!
    assert res["faName"] == None # Should be set to None automatically for projects!
    assert res["startingPosition"] == 'FRENCH'
    assert res["eliminate"] == True
    assert res["traverse"] == True
    assert res["highball"] == True
    assert res["noTopout"] == True
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
    assert res['id'] is not None
    assert len(res['linePaths']) == 0


def test_create_line_invalid_fa_year(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Video"
            }
        ],
        "gradeName": "7B+",
        "gradeScale": "FB",
        "type": "BOULDER",
        "rating": 5,
        "faYear": 9000,
        "faName": "Dave Graham",
        "startingPosition": 'FRENCH',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_rating(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Video"
            }
        ],
        "gradeName": "7B+",
        "gradeScale": "FB",
        "type": "BOULDER",
        "rating": 6,
        "faYear": 2014,
        "faName": "Dave Graham",
        "startingPosition": 'FRENCH',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_video_url(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "sdfsdfsdf",
                "title": "Video"
            }
        ],
        "gradeName": "7B+",
        "gradeScale": "FB",
        "type": "BOULDER",
        "rating": 5,
        "faYear": 2014,
        "faName": "Dave Graham",
        "startingPosition": 'FRENCH',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_grade_name(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Video"
            }
        ],
        "gradeName": "dfgdf",
        "gradeScale": "FB",
        "type": "BOULDER",
        "rating": 5,
        "faYear": 2000,
        "faName": "Dave Graham",
        "startingPosition": 'FRENCH',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_grade_scale_for_line_type(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Video"
            }
        ],
        "gradeName": "7B+",
        "gradeScale": "FB",
        "type": "TRAD",
        "rating": 5,
        "faYear": 2000,
        "faName": "Dave Graham",
        "startingPosition": 'FRENCH',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_grade_scale(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Video"
            }
        ],
        "gradeName": "7B+",
        "gradeScale": "TRESGDFGD",
        "type": "BOULDER",
        "rating": 5,
        "faYear": 2000,
        "faName": "Dave Graham",
        "startingPosition": 'FRENCH',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_line_type(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Video"
            }
        ],
        "gradeName": "7B+",
        "gradeScale": "FB",
        "type": "WEIRD",
        "rating": 5,
        "faYear": 2000,
        "faName": "Dave Graham",
        "startingPosition": 'FRENCH',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 400

def test_create_line_invalid_line_starting_position(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Video"
            }
        ],
        "gradeName": "7B+",
        "gradeScale": "FB",
        "type": "WEIRD",
        "rating": 5,
        "faYear": 2000,
        "faName": "Dave Graham",
        "startingPosition": 'PRE_CLIPPED',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 400

def test_create_line_invalid_video_payload(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            }
        ],
        "gradeName": "7B+",
        "gradeScale": "FB",
        "type": "WEIRD",
        "rating": 5,
        "faYear": 2000,
        "faName": "Dave Graham",
        "startingPosition": 'SIT',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 400


def test_successful_get_lines(client):
    rv = client.get('/api/areas/dritter-block-von-links/lines')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[0]['id'] == "1c39fd1f-6341-4161-a83f-e5de0f861c48"
    assert res[0]['slug'] == "super-spreader"
    assert res[0]['name'] == "Super-Spreader"
    assert len(res[0]['linePaths']) == 2
    assert res[0]['linePaths'][0]['orderIndex'] == 0
    assert res[0]['linePaths'][0]['topoImage']['id'] == '4e8f0a85-b971-409b-a972-7805173b4a19'
    assert res[1]['linePaths'][0]['topoImage']['orderIndex'] == 0
    assert res[1]['id'] == "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0"
    assert res[1]['slug'] == "treppe"
    assert res[1]['name'] == "Treppe"
    assert len(res[1]['linePaths']) == 1
    assert res[1]['linePaths'][0]['orderIndex'] == 1
    assert res[1]['linePaths'][0]['topoImage']['id'] == '4e8f0a85-b971-409b-a972-7805173b4a19'
    assert res[1]['linePaths'][0]['topoImage']['orderIndex'] == 0


def test_successful_get_line(client):
    rv = client.get('/api/lines/super-spreader')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['name'] == "Super-Spreader"
    assert res['slug'] == "super-spreader"
    assert res['description'] == "<p>Geiler Kühlschrankboulder!</p>"
    assert res['videos'][0]['url'] == "https://www.youtube.com/watch?v=8A_9oHuTkQA"
    assert res['gradeName'] == "8A"
    assert res['gradeScale'] == "FB"
    assert res['type'] == "BOULDER"
    assert res["rating"] == 5
    assert res["faYear"] == 2024
    assert res["faName"] == "Felix Engelmann"
    assert res["startingPosition"] == 'SIT'
    assert res["eliminate"] == False
    assert res["traverse"] == False
    assert res["highball"] == False
    assert res["noTopout"] == True
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
    assert res['id'] is not None
    assert len(res['linePaths']) == 2
    assert res['linePaths'][0]['topoImage']['id'] == '4e8f0a85-b971-409b-a972-7805173b4a19'
    assert res['linePaths'][0]['orderIndex'] == 0
    assert res['linePaths'][0]['topoImage']['orderIndex'] == 0


def test_get_deleted_line(client):
    rv = client.get('/api/lines/linie-existiert-nicht-mehr')
    assert rv.status_code == 404
    res = json.loads(rv.data)
    assert res['message'] == "ENTITY_NOT_FOUND"


def test_successful_delete_line(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/lines/super-spreader', headers=access_headers)
    assert rv.status_code == 204


def test_successful_edit_line(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Video"
            }
        ],
        "gradeName": "7B+",
        "gradeScale": "FB",
        "type": "BOULDER",
        "rating": 5,
        "faYear": 2016,
        "faName": "Dave Graham",
        "startingPosition": 'STAND',
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "noTopout": True,
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
    }

    rv = client.put('/api/lines/treppe', headers=access_headers, json=line_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['name'] == "Es"
    assert res['slug'] == "es"
    assert res['description'] == "Super Boulder"
    assert res['videos'][0]['url'] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert res['gradeName'] == "7B+"
    assert res['gradeScale'] == "FB"
    assert res['type'] == "BOULDER"
    assert res["rating"] == 5
    assert res["faYear"] == 2016
    assert res["faName"] == "Dave Graham"
    assert res["startingPosition"] == 'STAND'
    assert res["eliminate"] == True
    assert res["traverse"] == True
    assert res["highball"] == True
    assert res["noTopout"] == True
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
    assert res['id'] is not None
    assert len(res['linePaths']) == 1
    assert res['linePaths'][0]['topoImage']['id'] == '4e8f0a85-b971-409b-a972-7805173b4a19'
    assert res['linePaths'][0]['orderIndex'] == 1
    assert res['linePaths'][0]['topoImage']['orderIndex'] == 0

