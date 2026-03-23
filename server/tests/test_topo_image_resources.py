from models.area import Area
from models.enums.map_marker_type_enum import MapMarkerType
from models.file import File
from models.line import Line
from models.line_path import LinePath
from models.topo_image import TopoImage


def test_move_topo_image_moves_connected_lines_and_deletes_old_area_paths(client, moderator_token):
    # pick a source area that has topo images
    source_area_slug = "dritter-block-von-links"
    topo_images = client.get(f"/api/areas/{source_area_slug}/topo-images").json
    assert len(topo_images) > 0
    image_id = topo_images[0]["id"]
    topo_image_before = TopoImage.find_by_id(image_id)
    old_area_id = topo_image_before.area_id

    # create a dedicated line to move with the topo image
    line_data = {
        "name": "Topo Move Line",
        "description": "test",
        "videos": [],
        "color": None,
        "authorGradeValue": 1,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": None,
        "faYear": None,
        "faDate": None,
        "faName": None,
        "startingPosition": "FRENCH",
        "eliminate": False,
        "traverse": False,
        "highball": False,
        "morpho": False,
        "lowball": False,
        "noTopout": False,
        "badDropzone": False,
        "childFriendly": False,
        "roof": False,
        "slab": False,
        "vertical": False,
        "overhang": False,
        "athletic": False,
        "technical": False,
        "endurance": False,
        "cruxy": False,
        "dyno": False,
        "jugs": False,
        "sloper": False,
        "crimps": False,
        "pockets": False,
        "pinches": False,
        "crack": False,
        "dihedral": False,
        "compression": False,
        "arete": False,
        "mantle": False,
        "secret": False,
        "closed": False,
        "closedReason": None,
    }
    rv_line = client.post(f"/api/areas/{source_area_slug}/lines", token=moderator_token, json=line_data)
    assert rv_line.status_code == 201
    line = Line.find_by_slug(rv_line.json["slug"])
    # Attach a line path for this line to the topo image
    rv = client.post(
        f"/api/topo-images/{image_id}/line-paths",
        token=moderator_token,
        json={"line": str(line.id), "path": [1.0, 1.0, 2.0, 2.0]},
    )
    assert rv.status_code == 201

    # Create another topo image in the same old area and add a line path there too
    # so we can verify deletion of line paths still connected to old area after move.
    second_topo_images = client.get(f"/api/areas/{source_area_slug}/topo-images").json
    if len(second_topo_images) > 1:
        old_area_other_image_id = second_topo_images[1]["id"]
    else:
        # Deterministically create a second topo image
        first_topo_image = TopoImage.find_by_id(image_id)
        other_file = File.query.filter(File.id != first_topo_image.file_id).first()
        assert other_file is not None

        rv_add = client.post(
            f"/api/areas/{source_area_slug}/topo-images",
            token=moderator_token,
            json={
                "image": str(other_file.id),
                "mapMarkers": [],
                "title": None,
                "description": None,
            },
        )
        assert rv_add.status_code == 201
        old_area_other_image_id = rv_add.json["id"]

    if LinePath.query.filter_by(line_id=line.id, topo_image_id=old_area_other_image_id).count() == 0:
        rv = client.post(
            f"/api/topo-images/{old_area_other_image_id}/line-paths",
            token=moderator_token,
            json={"line": str(line.id), "path": [3.0, 3.0, 4.0, 4.0]},
        )
        assert rv.status_code == 201

    assert LinePath.query.filter_by(line_id=line.id).count() >= 1

    # Move topo image to another area (pick any other area from DB)
    target_area = Area.query.filter(Area.slug != source_area_slug).first()
    assert target_area is not None
    target_area_slug = target_area.slug

    rv = client.put(
        f"/api/topo-images/{image_id}/move",
        token=moderator_token,
        json={"areaSlug": target_area_slug},
    )
    assert rv.status_code == 200

    topo_image_after = TopoImage.find_by_id(image_id)
    assert topo_image_after.area_id != old_area_id
    assert topo_image_after.area_id == target_area.id

    # Connected line must now be in target area
    moved_line = Line.find_by_slug(line.slug)
    assert moved_line.area_slug == target_area_slug

    # No line paths for the moved line may remain that are still connected to topo images in the old area
    remaining_old_area_paths = (
        LinePath.query.join(TopoImage, LinePath.topo_image_id == TopoImage.id)
        .filter(LinePath.line_id == line.id, TopoImage.area_id == old_area_id)
        .count()
    )
    assert remaining_old_area_paths == 0


def test_successful_edit_topo_image(client, moderator_token):
    topo_image = TopoImage.query.first()
    any_file_id = str(File.query.filter(File.id != topo_image.file_id).first().id)

    topo_image_data = {
        "image": any_file_id,
        "mapMarkers": [
            {
                "lat": 12.13,
                "lng": 42.42,
                "type": MapMarkerType.TOPO_IMAGE.value,
                "description": None,
                "name": None,
            }
        ],
        "title": "Geiler Block",
        "description": "Ein wahrhaft geiler Block!",
    }

    rv = client.put(f"/api/topo-images/{topo_image.id}", token=moderator_token, json=topo_image_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["image"]["id"] != any_file_id  # Image ID on update must be ignored!
    assert res["mapMarkers"][0]["lat"] == 12.13
    assert res["mapMarkers"][0]["lng"] == 42.42
    assert res["mapMarkers"][0]["type"] == MapMarkerType.TOPO_IMAGE.value
    assert res["title"] == "Geiler Block"
    assert res["description"] == "Ein wahrhaft geiler Block!"
    assert res["id"] == str(topo_image.id)


def test_successful_add_topo_image(client, moderator_token):
    any_file_id = str(File.query.first().id)

    topo_image_data = {
        "image": any_file_id,
        "mapMarkers": [
            {
                "lat": 12.13,
                "lng": 42.42,
                "type": MapMarkerType.TOPO_IMAGE.value,
                "description": None,
                "name": None,
            }
        ],
        "title": "Geiler Block",
        "description": "Ein wahrhaft geiler Block!",
    }
    rv = client.post("/api/areas/dritter-block-von-links/topo-images", token=moderator_token, json=topo_image_data)
    assert rv.status_code == 201
    res = rv.json
    assert isinstance(res["id"], str)
    assert res["image"]["id"] == any_file_id
    assert res["mapMarkers"][0]["lat"] == 12.13
    assert res["mapMarkers"][0]["lng"] == 42.42
    assert res["mapMarkers"][0]["type"] == MapMarkerType.TOPO_IMAGE.value
    assert res["title"] == "Geiler Block"
    assert res["description"] == "Ein wahrhaft geiler Block!"
    assert len(res["linePaths"]) == 0


def test_successful_get_topo_images(client):
    rv = client.get("/api/areas/dritter-block-von-links/topo-images")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
    assert isinstance(res[0]["id"], str)
    assert res[0]["image"]["id"] == str(File.query.filter_by(original_filename="Love it or leave it.JPG").first().id)
    assert res[0]["orderIndex"] == 0
    assert len(res[0]["mapMarkers"]) == 0
    assert res[0]["title"] is None
    assert res[0]["description"] is None
    assert res[1]["orderIndex"] == 1
    assert len(res[0]["linePaths"][0]["path"]) == 8


def test_successful_get_topo_image(client):
    topo_image = TopoImage.query.first()

    rv = client.get(f"/api/topo-images/{topo_image.id}")
    assert rv.status_code == 200
    res = rv.json
    assert res["id"] == str(topo_image.id)
    assert res["image"]["id"] == str(topo_image.file_id)
    assert len(res["mapMarkers"]) == 0
    assert res["title"] is None
    assert res["description"] is None
    assert len(res["linePaths"][0]["path"]) == 8


def test_successful_delete_topo_image(client, moderator_token):
    topo_image = TopoImage.query.first()

    rv = client.delete(f"/api/topo-images/{topo_image.id}", token=moderator_token)
    assert rv.status_code == 204


def test_successful_order_topo_images(client, moderator_token):
    topo_images = TopoImage.query.all()

    rv = client.get("/api/areas/dritter-block-von-links/topo-images")
    assert rv.status_code == 200
    res = rv.json
    assert res[0]["id"] == str(topo_images[0].id)
    assert res[0]["orderIndex"] == 0
    assert res[1]["id"] == str(topo_images[1].id)
    assert res[1]["orderIndex"] == 1

    new_order = {
        str(topo_images[0].id): 1,
        str(topo_images[1].id): 0,
    }
    rv = client.put(
        "/api/areas/dritter-block-von-links/topo-images/update-order", token=moderator_token, json=new_order
    )
    assert rv.status_code == 200

    rv = client.get("/api/areas/dritter-block-von-links/topo-images")
    assert rv.status_code == 200
    res = rv.json
    assert res[0]["id"] == str(topo_images[1].id)
    assert res[0]["orderIndex"] == 0
    assert res[1]["id"] == str(topo_images[0].id)
    assert res[1]["orderIndex"] == 1
