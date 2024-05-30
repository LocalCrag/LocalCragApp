import json

from tests.utils.user_test_util import get_login_headers


def test_create_secret_line_in_public_area(client):
    access_headers, refresh_headers = get_login_headers(client)
    line_data = {
        "name": "Es geheim",
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
        "secret": True,
    }

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res["secret"] == True

    # Test, that area, sector and crag are still public

    rv = client.get('/api/areas/dritter-block-von-links')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == False

    rv = client.get('/api/sectors/schattental')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == False

    rv = client.get('/api/crags/brione')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == False


def test_change_crag_to_secret_then_create_public_line_in_it(client):
    access_headers, refresh_headers = get_login_headers(client)

    crag_data = {
        "name": "brione",
        "description": "Fodere et scandere. 2",
        "shortDescription": "Fodere et scandere 3.",
        "rules": "Parken nur Samstag und Sonntag 2.",
        "portraitImage": '73a5a4cc-4ff4-4b7c-a57d-aa006f49aa08',
        "lat": 42.1,
        "lng": 42.2,
        "secret": True,
    }

    rv = client.put('/api/crags/brione', headers=access_headers, json=crag_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['secret'] == True

    # Test, that sectors, areas and lines are now also secret

    rv = client.get('/api/sectors/schattental', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == True

    rv = client.get('/api/sectors/oben', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == True

    rv = client.get('/api/areas/dritter-block-von-links', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == True

    rv = client.get('/api/lines/treppe', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == True

    # Create public line, check that parents are now public but siblings still secret

    line_data = {
        "name": "Es geheim",
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

    rv = client.post('/api/areas/dritter-block-von-links/lines', headers=access_headers, json=line_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res["secret"] == False

    rv = client.get('/api/areas/dritter-block-von-links', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == False

    rv = client.get('/api/sectors/schattental', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == False

    rv = client.get('/api/crags/brione', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == False

    rv = client.get('/api/crags/chironico', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == False  # Was public all the time!

    rv = client.get('/api/sectors/oben', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == True

    rv = client.get('/api/areas/noch-ein-bereich', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == True

    rv = client.get('/api/lines/treppe', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res["secret"] == True
