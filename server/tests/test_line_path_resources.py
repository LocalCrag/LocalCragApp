from models.area import Area
from models.line import Line
from models.line_path import LinePath
from models.topo_image import TopoImage


def test_successful_delete_line_path(client, moderator_token):
    line_path = LinePath.query.first()
    rv = client.delete(f"/api/line-paths/{line_path.id}", token=moderator_token)
    assert rv.status_code == 204


def test_successful_order_line_paths(client, moderator_token):
    line_paths = (
        LinePath.query.join(LinePath.line)
        .filter_by(area_id=Area.get_id_by_slug("shark-attack"))
        .order_by(LinePath.order_index)
        .all()
    )

    rv = client.get("/api/areas/shark-attack/topo-images")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
    assert res[0]["linePaths"][0]["id"] == str(line_paths[0].id)
    assert res[0]["linePaths"][1]["id"] == str(line_paths[1].id)
    topo_image_id = res[0]["id"]

    new_order = {
        str(line_paths[0].id): 1,
        str(line_paths[1].id): 0,
    }
    rv = client.put(f"/api/topo-images/{topo_image_id}/line-paths/update-order", token=moderator_token, json=new_order)
    assert rv.status_code == 200

    rv = client.get("/api/areas/shark-attack/topo-images")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
    assert res[0]["linePaths"][0]["id"] == str(line_paths[1].id)
    assert res[0]["linePaths"][1]["id"] == str(line_paths[0].id)


def test_successful_order_line_paths_for_line(client, moderator_token):
    line_paths = (
        LinePath.query.filter_by(line_id=Line.get_id_by_slug("super-spreader")).order_by(LinePath.order_index).all()
    )

    rv = client.get("/api/lines/super-spreader")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["linePaths"]) == 2
    assert res["linePaths"][0]["id"] == str(line_paths[0].id)
    assert res["linePaths"][1]["id"] == str(line_paths[1].id)

    new_order = {
        str(line_paths[0].id): 1,
        str(line_paths[1].id): 0,
    }
    rv = client.put("/api/lines/super-spreader/line-paths/update-order", token=moderator_token, json=new_order)
    assert rv.status_code == 200

    rv = client.get("/api/lines/super-spreader")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["linePaths"]) == 2
    assert res["linePaths"][0]["id"] == str(line_paths[1].id)
    assert res["linePaths"][1]["id"] == str(line_paths[0].id)


def test_successful_sync_line_paths_create_update_delete_and_reorder(client, moderator_token):
    rv = client.get("/api/areas/shark-attack/topo-images")
    assert rv.status_code == 200
    topo_image_id = rv.json[0]["id"]
    existing_line_paths = rv.json[0]["linePaths"]
    assert len(existing_line_paths) == 2

    super_spreader = Line.find_by_slug("super-spreader")
    the_vessel = Line.find_by_slug("the-vessel")
    updated_path = [11.0, 22.0, 33.0, 44.0, 55.0, 66.0]
    new_path = [1.0, 2.0, 3.0, 4.0]

    vessel_path = next(line_path for line_path in existing_line_paths if line_path["line"]["id"] == str(the_vessel.id))
    spreader_path = next(
        line_path for line_path in existing_line_paths if line_path["line"]["id"] == str(super_spreader.id)
    )

    # Delete super-spreader by omitting it; update the-vessel.
    rv = client.put(
        f"/api/topo-images/{topo_image_id}/line-paths",
        token=moderator_token,
        json={
            "linePaths": [
                {
                    "id": vessel_path["id"],
                    "line": vessel_path["line"]["id"],
                    "path": updated_path,
                },
            ]
        },
    )
    assert rv.status_code == 200, rv.text
    assert len(rv.json) == 1

    # Recreate super-spreader and reorder so the-vessel is first.
    rv = client.put(
        f"/api/topo-images/{topo_image_id}/line-paths",
        token=moderator_token,
        json={
            "linePaths": [
                {
                    "id": vessel_path["id"],
                    "line": vessel_path["line"]["id"],
                    "path": updated_path,
                },
                {
                    "line": str(super_spreader.id),
                    "path": new_path,
                },
            ]
        },
    )
    assert rv.status_code == 200, rv.text
    res = rv.json
    assert len(res) == 2
    assert res[0]["path"] == updated_path
    assert res[0]["line"]["id"] == str(the_vessel.id)
    assert res[1]["line"]["id"] == str(super_spreader.id)
    assert res[1]["path"] == new_path
    assert res[1]["id"] != spreader_path["id"]

    rv = client.get("/api/areas/shark-attack/topo-images")
    assert rv.status_code == 200
    line_paths = rv.json[0]["linePaths"]
    assert len(line_paths) == 2
    assert line_paths[0]["id"] == vessel_path["id"]
    assert line_paths[1]["line"]["id"] == str(super_spreader.id)
    assert line_paths[0]["orderIndex"] == 0
    assert line_paths[1]["orderIndex"] == 1


def test_sync_line_paths_path_too_short(client, moderator_token):
    stairs = Line.find_by_slug("the-vessel")
    topo_image = TopoImage.query.filter_by(area_id=stairs.area_id).order_by(TopoImage.order_index.desc()).first()
    rv = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=moderator_token,
        json={"linePaths": [{"line": str(stairs.id), "path": [1, 2]}]},
    )
    assert rv.status_code == 400


def test_sync_line_paths_path_out_of_bounds(client, moderator_token):
    stairs = Line.find_by_slug("the-vessel")
    topo_image = TopoImage.query.filter_by(area_id=stairs.area_id).order_by(TopoImage.order_index.desc()).first()
    rv = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=moderator_token,
        json={"linePaths": [{"line": str(stairs.id), "path": [1, 2, 101, 101]}]},
    )
    assert rv.status_code == 400


def test_sync_line_paths_path_not_even(client, moderator_token):
    stairs = Line.find_by_slug("the-vessel")
    topo_image = TopoImage.query.filter_by(area_id=stairs.area_id).order_by(TopoImage.order_index.desc()).first()
    rv = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=moderator_token,
        json={"linePaths": [{"line": str(stairs.id), "path": [1, 2, 100]}]},
    )
    assert rv.status_code == 400


def test_sync_line_paths_rejects_duplicate_lines(client, moderator_token):
    rv = client.get("/api/areas/shark-attack/topo-images")
    topo_image_id = rv.json[0]["id"]
    line_id = rv.json[0]["linePaths"][0]["line"]["id"]

    rv = client.put(
        f"/api/topo-images/{topo_image_id}/line-paths",
        token=moderator_token,
        json={
            "linePaths": [
                {"line": line_id, "path": [1, 2, 3, 4]},
                {"line": line_id, "path": [5, 6, 7, 8]},
            ]
        },
    )
    assert rv.status_code == 400


def test_sync_line_paths_rejects_invalid_line_path_id(client, moderator_token):
    rv = client.get("/api/areas/shark-attack/topo-images")
    topo_image_id = rv.json[0]["id"]
    line_path = rv.json[0]["linePaths"][0]

    rv = client.put(
        f"/api/topo-images/{topo_image_id}/line-paths",
        token=moderator_token,
        json={
            "linePaths": [
                {
                    "id": line_path["id"],
                    "line": line_path["line"]["id"],
                    "path": [1, 2, 3, 4],
                }
            ]
        },
    )
    assert rv.status_code == 200

    other_line_path = LinePath.query.filter(LinePath.id != line_path["id"]).first()
    rv = client.put(
        f"/api/topo-images/{topo_image_id}/line-paths",
        token=moderator_token,
        json={
            "linePaths": [
                {
                    "id": str(other_line_path.id),
                    "line": line_path["line"]["id"],
                    "path": [1, 2, 3, 4],
                }
            ]
        },
    )
    assert rv.status_code == 400
