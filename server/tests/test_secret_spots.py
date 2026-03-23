from extensions import db
from models.area import Area
from models.crag import Crag
from models.enums.map_marker_type_enum import MapMarkerType
from models.file import File
from models.line import Line
from models.line_path import LinePath
from models.sector import Sector
from models.topo_image import TopoImage


def test_create_secret_line_in_public_area(client, moderator_token):
    line_data = {
        "name": "Es geheim",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
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
    assert res["secret"] is True

    # Test, that area, sector and crag are still public

    rv = client.get("/api/areas/dritter-block-von-links")
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is False

    rv = client.get("/api/sectors/schattental")
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is False

    rv = client.get("/api/crags/brione")
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is False


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
        "blocweatherUrl": None,
    }

    rv = client.put("/api/crags/brione", token=moderator_token, json=crag_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True

    # Test, that sectors, areas and lines are now also secret

    rv = client.get("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True

    rv = client.get("/api/sectors/oben", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True

    rv = client.get("/api/areas/dritter-block-von-links", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True

    rv = client.get("/api/lines/treppe", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True

    # Create public line, check that parents are now public but siblings still secret

    line_data = {
        "name": "Es geheim",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
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
    assert res["secret"] is False

    rv = client.get("/api/areas/dritter-block-von-links", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is False

    rv = client.get("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is False

    rv = client.get("/api/crags/brione", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is False

    rv = client.get("/api/crags/chironico", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is False  # Was public all the time!

    rv = client.get("/api/sectors/oben", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True

    rv = client.get("/api/areas/noch-ein-bereich", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True

    rv = client.get("/api/lines/treppe", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True


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
        "blocweatherUrl": None,
    }

    rv = client.put("/api/crags/brione", token=moderator_token, json=crag_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True

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
        "blocweatherUrl": None,
    }

    rv = client.put("/api/crags/brione", token=moderator_token, json=crag_data)
    assert rv.status_code == 200

    # Add a secret line
    line_data = {
        "name": "Es geheim",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
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
    assert res["secret"] is True

    # Test, that area, sector and crag are still secret

    rv = client.get("/api/areas/dritter-block-von-links", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True

    rv = client.get("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True

    rv = client.get("/api/crags/glees-2", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["secret"] is True


def test_gallery_secret(client, moderator_token, member_token):
    # First create a secret line
    line_data = {
        "name": "Es geheim",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 20,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
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
    assert res["secret"] is True
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
    assert res["secret"] is False

    # Anonymous users can now see the image
    rv = client.get(f"/api/gallery?page=1&tag-object-type=Line&tag-object-slug={line_slug}")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 1


def test_move_line_into_secret_area_forces_line_secret(client, moderator_token):
    # pick a public line + a target secret area by setting an existing area to secret
    line = Line.find_by_slug("treppe")
    assert line.secret is False

    target_area = Area.query.filter(Area.id != line.area_id).first()
    assert target_area is not None
    assert target_area.secret is False

    # Make target area secret directly in DB (we only want to test the move endpoint here)
    target_area.secret = True
    db.session.add(target_area)
    db.session.commit()

    rv = client.put(
        f"/api/lines/{line.slug}/move",
        token=moderator_token,
        json={"areaSlug": target_area.slug},
    )
    assert rv.status_code == 200

    moved = Line.find_by_slug(line.slug)
    assert moved.area_id == target_area.id
    assert moved.secret is True


def test_move_area_into_secret_sector_forces_area_secret(client, moderator_token):
    area = Area.find_by_slug("dritter-block-von-links")
    assert area.secret is False
    target_sector = Sector.query.filter(Sector.id != area.sector_id).first()
    assert target_sector is not None
    assert target_sector.secret is False

    # Make target sector secret directly in DB
    target_sector.secret = True
    db.session.add(target_sector)
    db.session.commit()

    rv = client.put(
        f"/api/areas/{area.slug}/move",
        token=moderator_token,
        json={"sectorSlug": target_sector.slug},
    )
    assert rv.status_code == 200

    moved = Area.find_by_slug(area.slug)
    assert moved.sector_id == target_sector.id
    assert moved.secret is True


def test_move_sector_into_secret_crag_forces_sector_secret(client, moderator_token):
    sector = Sector.find_by_slug("schattental")
    assert sector.secret is False
    target_crag = Crag.query.filter(Crag.id != sector.crag_id).first()
    assert target_crag is not None
    assert target_crag.secret is False

    # Make target crag secret directly in DB
    target_crag.secret = True
    db.session.add(target_crag)
    db.session.commit()

    rv = client.put(
        f"/api/sectors/{sector.slug}/move",
        token=moderator_token,
        json={"cragSlug": target_crag.slug},
    )
    assert rv.status_code == 200

    moved = Sector.find_by_slug(sector.slug)
    assert moved.crag_id == target_crag.id
    assert moved.secret is True


def test_move_topo_image_into_secret_area_forces_connected_lines_secret(client, moderator_token):
    """Moving a topo image also moves connected lines; secret rule must be applied to those moved lines."""
    source_area = Area.find_by_slug("dritter-block-von-links")
    assert source_area.secret is False
    topo_image = TopoImage.query.filter_by(area_id=source_area.id).first()
    assert topo_image is not None

    # Pick a line in the same area and ensure it is connected to the topo image via a line path
    line = Line.query.filter_by(area_id=source_area.id).first()
    assert line is not None
    assert line.secret is False

    # Ensure a target area different from source and set it to secret
    target_area = Area.query.filter(Area.id != source_area.id).first()
    assert target_area is not None
    assert target_area.secret is False
    # Make target area secret directly in DB
    target_area.secret = True
    db.session.add(target_area)
    db.session.commit()

    # Create DB line path connection if missing
    if LinePath.query.filter_by(line_id=line.id, topo_image_id=topo_image.id).count() == 0:
        # delete any existing for the line to avoid PK collisions in weird fixture cases
        LinePath.query.filter_by(line_id=line.id).delete(synchronize_session=False)
        db.session.add(
            LinePath(
                line_id=line.id,
                topo_image_id=topo_image.id,
                created_by_id=topo_image.created_by_id,
                order_index=0,
                order_index_for_line=0,
                path=[1.0, 1.0, 2.0, 2.0],
            )
        )
        db.session.commit()

    rv = client.put(
        f"/api/topo-images/{topo_image.id}/move",
        token=moderator_token,
        json={"areaSlug": target_area.slug},
    )
    assert rv.status_code == 200

    moved_line = Line.find_by_slug(line.slug)
    assert moved_line.area_id == target_area.id
    assert moved_line.secret is True
