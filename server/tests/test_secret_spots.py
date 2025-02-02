from models.enums.map_marker_type_enum import MapMarkerType
from models.file import File


def test_create_secret_line_in_public_area(client, moderator_token):
    line_data = {
        "name": "Es geheim",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "gradeValue": 19,
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
        "secret": True,
        "closed": False,
        "closedReason": None,
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["secret"] == True

    # Test, that area, sector and crag are still public

    rv = client.get("/api/areas/dritter-block-von-links")
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == False

    rv = client.get("/api/sectors/schattental")
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == False

    rv = client.get("/api/crags/brione")
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == False


def test_change_crag_to_secret_then_create_public_line_in_it(client, moderator_token):
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
        "secret": True,
        "closed": False,
        "closedReason": None,
        "defaultBoulderScale": "FB",
        "defaultSportScale": None,
        "defaultTradScale": None,
    }

    rv = client.put("/api/crags/brione", token=moderator_token, json=crag_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True

    # Test, that sectors, areas and lines are now also secret

    rv = client.get("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True

    rv = client.get("/api/sectors/oben", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True

    rv = client.get("/api/areas/dritter-block-von-links", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True

    rv = client.get("/api/lines/treppe", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True

    # Create public line, check that parents are now public but siblings still secret

    line_data = {
        "name": "Es geheim",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "gradeValue": 19,
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
    assert res["secret"] == False

    rv = client.get("/api/areas/dritter-block-von-links", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == False

    rv = client.get("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == False

    rv = client.get("/api/crags/brione", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == False

    rv = client.get("/api/crags/chironico", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == False  # Was public all the time!

    rv = client.get("/api/sectors/oben", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True

    rv = client.get("/api/areas/noch-ein-bereich", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True

    rv = client.get("/api/lines/treppe", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True


def test_users_that_are_not_logged_in_or_not_at_least_members_cannot_view_secret_items(
    client, moderator_token, member_token, user_token
):
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
        "secret": True,
        "closed": False,
        "closedReason": None,
        "defaultBoulderScale": "FB",
        "defaultSportScale": None,
        "defaultTradScale": None,
    }

    rv = client.put("/api/crags/brione", token=moderator_token, json=crag_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True

    rv = client.get("/api/crags/brione", json=crag_data)
    assert rv.status_code == 401

    rv = client.get("/api/lines/treppe", json=crag_data)
    assert rv.status_code == 401

    # Logged in but not member
    rv = client.get("/api/crags/brione", token=user_token, json=crag_data)
    assert rv.status_code == 401

    # Logged in member
    rv = client.get("/api/crags/brione", token=member_token, json=crag_data)
    assert rv.status_code == 200


# Test that creating a secret line in a secret area doesn't change the secret state of it's parents
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
        "secret": True,
        "closed": False,
        "closedReason": None,
        "defaultBoulderScale": "FB",
        "defaultSportScale": None,
        "defaultTradScale": None,
    }

    rv = client.put("/api/crags/brione", token=moderator_token, json=crag_data)
    assert rv.status_code == 200

    # Add a secret line
    line_data = {
        "name": "Es geheim",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "gradeValue": 19,
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
        "secret": True,
        "closed": False,
        "closedReason": None,
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["secret"] == True

    # Test, that area, sector and crag are still secret

    rv = client.get("/api/areas/dritter-block-von-links", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True

    rv = client.get("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True

    rv = client.get("/api/crags/glees-2", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == True


def test_gallery_secret(client, moderator_token, member_token):
    # First create a secret line
    line_data = {
        "name": "Es geheim",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "gradeValue": 20,
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
        "secret": True,
        "closed": False,
        "closedReason": None,
    }
    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["secret"] == True
    line_id = res["id"]
    line_slug = res["slug"]

    # Create an image for the secret line
    image_id = File.query.filter_by(original_filename="Love it or leave it.JPG").first().id
    post_data = {"fileId": image_id, "tags": [{"objectType": "Line", "objectId": line_id}]}
    rv = client.post("/api/gallery", token=member_token, json=post_data)
    assert rv.status_code == 201

    # Check, that the image is now shown in the line's gallery for logged in members
    rv = client.get(f"/api/gallery?page=1&tag-object-type=Line&tag-object-slug={line_slug}", token=member_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 1

    # But not for anonymous users
    rv = client.get(f"/api/gallery?page=1&tag-object-type=Line&tag-object-slug={line_slug}")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 0

    # Set the line public
    line_data["secret"] = False
    rv = client.put("/api/lines/" + line_slug, token=moderator_token, json=line_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] == False

    # Anonymous users can now see the image
    rv = client.get(f"/api/gallery?page=1&tag-object-type=Line&tag-object-slug={line_slug}")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 1
