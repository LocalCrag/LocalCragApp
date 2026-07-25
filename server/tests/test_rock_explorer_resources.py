def _point_payload(**overrides):
    data = {
        "title": "North face prospect",
        "description": "Looks promising",
        "potential": "HIGH",
        "rockQuality": "PRIME",
        "rockType": "GRANITE",
        "gradeLineType": "BOULDER",
        "gradeScale": "FB",
        "gradeValueMin": 10,
        "gradeValueMax": 16,
        "accessIssues": ["NSG"],
        "geometry": {"type": "Point", "coordinates": [8.1, 50.2]},
        "clusterId": None,
        "cragId": None,
        "sectorId": None,
        "areaId": None,
        "lineId": None,
    }
    data.update(overrides)
    return data


def test_member_can_create_and_get_feature(client, member_token):
    rv = client.post("/api/rock-explorer/features", token=member_token, json=_point_payload())
    assert rv.status_code == 201
    created = rv.json
    assert created["title"] == "North face prospect"
    assert created["potential"] == "HIGH"
    assert created["rockQuality"] == "PRIME"
    assert created["rockType"] == "GRANITE"
    assert created["geometry"]["type"] == "Point"
    assert created["accessIssues"] == ["NSG"]
    assert created["id"] is not None

    rv = client.get(f"/api/rock-explorer/features/{created['id']}", token=member_token)
    assert rv.status_code == 200
    assert rv.json["id"] == created["id"]


def test_non_member_cannot_access_features(client, user_token):
    rv = client.get("/api/rock-explorer/features", token=user_token)
    assert rv.status_code == 401

    rv = client.post("/api/rock-explorer/features", token=user_token, json=_point_payload())
    assert rv.status_code == 401


def test_anonymous_cannot_access_features(client):
    rv = client.get("/api/rock-explorer/features")
    assert rv.status_code == 401


def test_invalid_geometry_rejected(client, member_token):
    rv = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_point_payload(geometry={"type": "LineString", "coordinates": [[0, 0], [1, 1]]}),
    )
    assert rv.status_code == 400


def test_polygon_feature_accepted(client, member_token):
    polygon = {
        "type": "Polygon",
        "coordinates": [[[8.0, 50.0], [8.1, 50.0], [8.1, 50.1], [8.0, 50.1], [8.0, 50.0]]],
    }
    rv = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_point_payload(title="Poly area", geometry=polygon),
    )
    assert rv.status_code == 201
    assert rv.json["geometry"]["type"] == "Polygon"


def test_cluster_crud_and_feature_assignment(client, member_token):
    cluster_rv = client.post(
        "/api/rock-explorer/clusters",
        token=member_token,
        json={"title": "North ridge", "description": "Cluster A", "accessIssues": []},
    )
    assert cluster_rv.status_code == 201
    cluster_id = cluster_rv.json["id"]

    feature_rv = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_point_payload(clusterId=cluster_id),
    )
    assert feature_rv.status_code == 201
    feature_id = feature_rv.json["id"]
    assert feature_rv.json["clusterId"] == cluster_id

    get_cluster = client.get(f"/api/rock-explorer/clusters/{cluster_id}", token=member_token)
    assert get_cluster.status_code == 200
    assert feature_id in get_cluster.json["featureIds"]

    # Clear cluster assignment
    update = client.put(
        f"/api/rock-explorer/features/{feature_id}",
        token=member_token,
        json=_point_payload(clusterId=None, title="Unclustered"),
    )
    assert update.status_code == 200
    assert update.json["clusterId"] is None

    delete_cluster = client.delete(f"/api/rock-explorer/clusters/{cluster_id}", token=member_token)
    assert delete_cluster.status_code == 204


def test_features_geojson_and_filter(client, member_token):
    client.post("/api/rock-explorer/features", token=member_token, json=_point_payload(potential="HIGH"))
    client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_point_payload(title="Low pot", potential="LOW"),
    )

    geo = client.get("/api/rock-explorer/features.geojson", token=member_token)
    assert geo.status_code == 200
    assert geo.json["type"] == "FeatureCollection"
    assert len(geo.json["features"]) >= 2
    assert geo.json["features"][0]["geometry"]["type"] in ("Point", "Polygon")
    assert "potential" in geo.json["features"][0]["properties"]

    filtered = client.get("/api/rock-explorer/features?potential=HIGH", token=member_token)
    assert filtered.status_code == 200
    assert all(f["potential"] == "HIGH" for f in filtered.json)


def test_member_can_update_and_delete_feature(client, member_token):
    created = client.post("/api/rock-explorer/features", token=member_token, json=_point_payload()).json
    feature_id = created["id"]

    updated = client.put(
        f"/api/rock-explorer/features/{feature_id}",
        token=member_token,
        json=_point_payload(title="Updated title", potential="MEDIUM"),
    )
    assert updated.status_code == 200
    assert updated.json["title"] == "Updated title"
    assert updated.json["potential"] == "MEDIUM"

    deleted = client.delete(f"/api/rock-explorer/features/{feature_id}", token=member_token)
    assert deleted.status_code == 204

    missing = client.get(f"/api/rock-explorer/features/{feature_id}", token=member_token)
    assert missing.status_code == 404


def test_features_geojson_reports_has_images(client, member_token):
    from extensions import db
    from models.file import File
    from models.gallery_image import GalleryImage
    from models.rock_explorer_feature import RockExplorerFeature
    from models.tag import Tag

    tagged_id = client.post(
        "/api/rock-explorer/features", token=member_token, json=_point_payload(title="With image")
    ).json["id"]
    untagged_id = client.post(
        "/api/rock-explorer/features", token=member_token, json=_point_payload(title="Without image")
    ).json["id"]

    geo = client.get("/api/rock-explorer/features.geojson", token=member_token)
    props = {f["id"]: f["properties"] for f in geo.json["features"]}
    assert props[tagged_id]["hasImages"] is False
    assert props[untagged_id]["hasImages"] is False

    tag = Tag()
    tag.object = RockExplorerFeature.find_by_id(tagged_id)
    image = GalleryImage()
    image.file_id = File.query.filter_by(original_filename="Hate it or love it.JPG").first().id
    image.tags = [tag]
    db.session.add_all([tag, image])
    db.session.commit()

    geo = client.get("/api/rock-explorer/features.geojson", token=member_token)
    props = {f["id"]: f["properties"] for f in geo.json["features"]}
    assert props[tagged_id]["hasImages"] is True
    assert props[untagged_id]["hasImages"] is False
