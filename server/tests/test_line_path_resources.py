from models.area import Area
from models.line import Line
from models.line_path import LinePath
from models.topo_image import TopoImage


def test_successful_delete_line_path(client, moderator_token):
    line_path = LinePath.query.first()
    rv = client.delete(f"/api/line-paths/{line_path.id}", token=moderator_token)
    assert rv.status_code == 204


def test_successful_add_line_path(client, moderator_token):
    treppe = Line.find_by_slug("treppe")
    topo_image = TopoImage.query.filter_by(area_id=treppe.area_id).order_by(TopoImage.order_index.desc()).first()
    line_path_data = {"line": str(treppe.id), "path": [1, 2, 3, 4]}
    rv = client.post(f"/api/topo-images/{topo_image.id}/line-paths", token=moderator_token, json=line_path_data)
    assert rv.status_code == 201, rv.text
    res = rv.json
    assert type(res["id"]) == str
    assert res["line"]["id"] == str(treppe.id)
    assert len(res["path"]) == 4


def test_add_line_path_path_too_short(client, moderator_token):
    treppe = Line.find_by_slug("treppe")
    topo_image = TopoImage.query.filter_by(area_id=treppe.area_id).order_by(TopoImage.order_index.desc()).first()
    line_path_data = {"line": str(treppe.id), "path": [1, 2]}
    rv = client.post(f"/api/topo-images/{topo_image.id}/line-paths", token=moderator_token, json=line_path_data)
    assert rv.status_code == 400


def test_add_line_path_path_out_of_bounds(client, moderator_token):
    treppe = Line.find_by_slug("treppe")
    topo_image = TopoImage.query.filter_by(area_id=treppe.area_id).order_by(TopoImage.order_index.desc()).first()
    line_path_data = {"line": str(treppe.id), "path": [1, 2, 101, 101]}
    rv = client.post(f"/api/topo-images/{topo_image.id}/line-paths", token=moderator_token, json=line_path_data)
    assert rv.status_code == 400


def test_add_line_path_path_not_even(client, moderator_token):
    treppe = Line.find_by_slug("treppe")
    topo_image = TopoImage.query.filter_by(area_id=treppe.area_id).order_by(TopoImage.order_index.desc()).first()
    line_path_data = {"line": str(treppe.id), "path": [1, 2, 100]}
    rv = client.post(f"/api/topo-images/{topo_image.id}/line-paths", token=moderator_token, json=line_path_data)
    assert rv.status_code == 400


def test_add_line_path_path_duplicate_line(client, moderator_token):
    treppe = Line.find_by_slug("treppe")
    topo_image = TopoImage.query.filter_by(area_id=treppe.area_id).order_by(TopoImage.order_index).first()
    line_path_data = {"line": str(treppe.id), "path": [1, 2, 10, 100]}
    rv = client.post(f"/api/topo-images/{topo_image.id}/line-paths", token=moderator_token, json=line_path_data)
    assert rv.status_code == 400


def test_successful_order_line_paths(client, moderator_token):
    line_paths = (
        LinePath.query.join(LinePath.line)
        .filter_by(area_id=Area.get_id_by_slug("dritter-block-von-links"))
        .order_by(LinePath.order_index)
        .all()
    )

    rv = client.get("/api/areas/dritter-block-von-links/topo-images")
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

    rv = client.get("/api/areas/dritter-block-von-links/topo-images")
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
