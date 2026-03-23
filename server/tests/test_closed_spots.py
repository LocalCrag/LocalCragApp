from extensions import db
from models.area import Area
from models.crag import Crag
from models.enums.map_marker_type_enum import MapMarkerType
from models.file import File
from models.line import Line
from models.line_path import LinePath
from models.sector import Sector
from models.topo_image import TopoImage


def test_create_closed_line_in_open_area(client, moderator_token):
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
        "closed": True,
        "closedReason": "Missgünstige Verbandsgemeinde",
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["closed"] is True
    assert res["closedReason"] == "Missgünstige Verbandsgemeinde"

    # Test, that area, sector and crag are still open

    rv = client.get("/api/areas/dritter-block-von-links")
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] is False

    rv = client.get("/api/sectors/schattental")
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] is False

    rv = client.get("/api/crags/brione")
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] is False


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
        "blocweatherUrl": None,
    }

    rv = client.put("/api/crags/brione", token=moderator_token, json=crag_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] is True

    # Test, that sectors, areas and lines are now also closed

    rv = client.get("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] is True

    rv = client.get("/api/sectors/oben", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] is True


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
        "blocweatherUrl": None,
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
        "closed": True,
        "closedReason": "Privatgrund",
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["closed"] is True

    # Test, that area, sector and crag are still closed

    rv = client.get("/api/areas/dritter-block-von-links", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] is True

    rv = client.get("/api/sectors/schattental", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] is True

    rv = client.get("/api/crags/glees-2", token=moderator_token)
    assert rv.status_code == 200
    res = rv.json
    assert res["closed"] is True


def test_move_line_into_closed_area_forces_line_closed(client, moderator_token):
    line = Line.find_by_slug("treppe")
    assert line.closed is False
    target_area = Area.query.filter(Area.id != line.area_id).first()
    assert target_area is not None

    # Make target area closed directly in DB
    target_area.closed = True
    target_area.closed_reason = "test"
    db.session.add(target_area)
    db.session.commit()

    rv = client.put(
        f"/api/lines/{line.slug}/move",
        token=moderator_token,
        json={"areaId": str(target_area.id)},
    )
    assert rv.status_code == 200

    moved = Line.find_by_slug(line.slug)
    assert moved.area_id == target_area.id
    assert moved.closed is True


def test_move_area_into_closed_sector_forces_area_closed(client, moderator_token):
    area = Area.find_by_slug("dritter-block-von-links")
    assert area.closed is False
    target_sector = Sector.query.filter(Sector.id != area.sector_id).first()
    assert target_sector is not None

    # Make target sector closed directly in DB
    target_sector.closed = True
    target_sector.closed_reason = "test"
    db.session.add(target_sector)
    db.session.commit()

    rv = client.put(
        f"/api/areas/{area.slug}/move",
        token=moderator_token,
        json={"sectorId": str(target_sector.id)},
    )
    assert rv.status_code == 200

    moved = Area.find_by_slug(area.slug)
    assert moved.sector_id == target_sector.id
    assert moved.closed is True


def test_move_sector_into_closed_crag_forces_sector_closed(client, moderator_token):
    sector = Sector.find_by_slug("schattental")
    assert sector.closed is False
    target_crag = Crag.query.filter(Crag.id != sector.crag_id).first()
    assert target_crag is not None

    # Make target crag closed directly in DB
    target_crag.closed = True
    target_crag.closed_reason = "test"
    db.session.add(target_crag)
    db.session.commit()

    rv = client.put(
        f"/api/sectors/{sector.slug}/move",
        token=moderator_token,
        json={"cragId": str(target_crag.id)},
    )
    assert rv.status_code == 200

    moved = Sector.find_by_slug(sector.slug)
    assert moved.crag_id == target_crag.id
    assert moved.closed is True


def test_move_topo_image_into_closed_area_forces_connected_lines_closed(client, moderator_token):
    source_area = Area.find_by_slug("dritter-block-von-links")
    assert source_area.closed is False
    topo_image = TopoImage.query.filter_by(area_id=source_area.id).first()
    assert topo_image is not None

    line = Line.query.filter_by(area_id=source_area.id).first()
    assert line is not None
    assert line.closed is False

    target_area = Area.query.filter(Area.id != source_area.id).first()
    assert target_area is not None

    # make target area closed directly in DB
    target_area.closed = True
    target_area.closed_reason = "test"
    db.session.add(target_area)
    db.session.commit()

    if LinePath.query.filter_by(line_id=line.id, topo_image_id=topo_image.id).count() == 0:
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
        json={"areaId": str(target_area.id)},
    )
    assert rv.status_code == 200

    moved_line = Line.find_by_slug(line.slug)
    assert moved_line.area_id == target_area.id
    assert moved_line.closed is True
