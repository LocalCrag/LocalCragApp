"""Rock Explorer live-tracking drafts API tests (Phase 10)."""

from models.file import File


def _draft_payload(**overrides):
    data = {
        "status": "draft",
        "title": "Live session",
        "description": None,
        "potential": None,
        "geometry": None,
        "recordingDeviceId": "device-a",
        "recordingState": "recording",
        "paths": [],
        "parkingSites": [],
        "accessIssues": [],
        "topoLinks": [],
    }
    data.update(overrides)
    return data


def _published_payload(**overrides):
    data = {
        "title": "Published prospect",
        "description": None,
        "potential": "HIGH",
        "geometry": {"type": "Point", "coordinates": [8.1, 50.2]},
        "paths": [],
        "parkingSites": [],
        "accessIssues": [],
        "topoLinks": [],
    }
    data.update(overrides)
    return data


def _gps_path(path_id="path-1", coords=None, source="gps"):
    return {
        "id": path_id,
        "source": source,
        "title": None,
        "description": None,
        "geometry": {
            "type": "LineString",
            "coordinates": coords
            or [
                [8.10, 50.20],
                [8.11, 50.21],
            ],
        },
    }


def _file_id():
    return File.query.filter_by(original_filename="Hate it or love it.JPG").first().id


def test_draft_payload_helper_shape():
    payload = _draft_payload()
    assert payload["status"] == "draft"
    for key in (
        "title",
        "description",
        "potential",
        "geometry",
        "recordingDeviceId",
        "recordingState",
        "paths",
        "parkingSites",
        "accessIssues",
        "topoLinks",
    ):
        assert key in payload


def test_draft_excluded_from_geojson(client, member_token):
    """RE-TRACK-01, T-10-04: drafts omitted from GeoJSON; published included."""
    draft = client.post("/api/rock-explorer/features", token=member_token, json=_draft_payload()).json
    published = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_published_payload(title="Visible on map"),
    ).json

    geo = client.get("/api/rock-explorer/features.geojson", token=member_token)
    assert geo.status_code == 200
    ids = {f["id"] for f in geo.json["features"]}
    assert published["id"] in ids
    assert draft["id"] not in ids


def test_draft_idor_get_denied_for_non_owner(client, member_token, admin_token):
    """RE-TRACK-01, T-10-01: non-owner GET draft by id → 401."""
    draft = client.post("/api/rock-explorer/features", token=member_token, json=_draft_payload()).json

    owner_get = client.get(f"/api/rock-explorer/features/{draft['id']}", token=member_token)
    assert owner_get.status_code == 200

    other_get = client.get(f"/api/rock-explorer/features/{draft['id']}", token=admin_token)
    assert other_get.status_code == 401


def test_draft_recording_metadata_persisted(client, member_token):
    """RE-TRACK-02: draft stores device/state and multi-path source:gps."""
    paths = [
        _gps_path("p1", source="gps"),
        _gps_path("p2", [[8.12, 50.22], [8.13, 50.23]], source="manual"),
    ]
    rv = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_draft_payload(paths=paths, recordingState="paused"),
    )
    assert rv.status_code == 201
    body = rv.json
    assert body["status"] == "draft"
    assert body["recordingDeviceId"] == "device-a"
    assert body["recordingState"] == "paused"
    assert body["recordingUpdatedAt"] is not None
    assert len(body["paths"]) == 2
    assert body["paths"][0]["source"] == "gps"
    assert body["paths"][1]["source"] == "manual"


def test_path_rich_coords_accepted(client, member_token):
    """RE-TRACK-02: rich Position arrays and plain [lng,lat] both accepted."""
    rich = _gps_path(
        "rich",
        coords=[
            [8.10, 50.20, 100.0, 1710000000000, 5.0],
            [8.11, 50.21, 101.0, 1710000001000, 4.5],
        ],
        source="gps",
    )
    plain = _gps_path("plain", coords=[[8.12, 50.22], [8.13, 50.23]], source="manual")
    rv = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_draft_payload(paths=[rich, plain]),
    )
    assert rv.status_code == 201
    coords = rv.json["paths"][0]["geometry"]["coordinates"]
    assert len(coords[0]) == 5
    assert rv.json["paths"][1]["geometry"]["coordinates"][0] == [8.12, 50.22]


def test_draft_put_replaces_paths_no_append_route(client, member_token):
    """RE-TRACK-03, D-08: PUT grows paths; invented /append route → 404."""
    created = client.post("/api/rock-explorer/features", token=member_token, json=_draft_payload()).json
    feature_id = created["id"]

    grown = [_gps_path("p1"), _gps_path("p2", [[8.14, 50.24], [8.15, 50.25]])]
    put = client.put(
        f"/api/rock-explorer/features/{feature_id}",
        token=member_token,
        json=_draft_payload(paths=grown, title="Updated session"),
    )
    assert put.status_code == 200
    assert len(put.json["paths"]) == 2
    assert put.json["title"] == "Updated session"

    append = client.post(
        f"/api/rock-explorer/features/{feature_id}/append",
        token=member_token,
        json={"coordinates": [8.16, 50.26]},
    )
    assert append.status_code == 404


def test_device_lock_wrong_device_conflict(client, member_token):
    """RE-TRACK-04, T-10-02: wrong recordingDeviceId → 409; matching → 200/204."""
    created = client.post("/api/rock-explorer/features", token=member_token, json=_draft_payload()).json
    feature_id = created["id"]

    wrong_put = client.put(
        f"/api/rock-explorer/features/{feature_id}",
        token=member_token,
        json=_draft_payload(recordingDeviceId="other-device", title="hijack"),
    )
    assert wrong_put.status_code == 409

    ok_put = client.put(
        f"/api/rock-explorer/features/{feature_id}",
        token=member_token,
        json=_draft_payload(title="same device"),
    )
    assert ok_put.status_code == 200
    assert ok_put.json["title"] == "same device"
    assert ok_put.json["recordingDeviceId"] == "device-a"

    wrong_del = client.delete(
        f"/api/rock-explorer/features/{feature_id}?recordingDeviceId=other-device",
        token=member_token,
    )
    assert wrong_del.status_code == 409

    ok_del = client.delete(
        f"/api/rock-explorer/features/{feature_id}?recordingDeviceId=device-a",
        token=member_token,
    )
    assert ok_del.status_code == 204


def test_clone_draft_copies_paths_and_images(client, member_token, admin_token):
    """RE-TRACK-04, T-10-03/T-10-05: clone new id, paths, device; duplicate gallery tags."""
    paths = [_gps_path("p1"), _gps_path("p2", [[8.14, 50.24], [8.15, 50.25]])]
    created = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_draft_payload(paths=paths, title="Source session"),
    ).json
    source_id = created["id"]

    gallery = client.post(
        "/api/gallery",
        token=member_token,
        json={
            "fileId": _file_id(),
            "tags": [{"objectType": "RockExplorerFeature", "objectId": source_id}],
        },
    )
    assert gallery.status_code == 201
    image_id = gallery.json["id"]

    clone_rv = client.post(
        f"/api/rock-explorer/features/{source_id}/clone",
        token=member_token,
        json={"recordingDeviceId": "device-b"},
    )
    assert clone_rv.status_code == 201
    clone = clone_rv.json
    assert clone["id"] != source_id
    assert clone["status"] == "draft"
    assert clone["recordingDeviceId"] == "device-b"
    assert clone["title"] == "Source session"
    assert len(clone["paths"]) == 2
    assert clone["paths"][0]["id"] == "p1"
    assert clone["paths"][1]["id"] == "p2"

    source_get = client.get(f"/api/rock-explorer/features/{source_id}", token=member_token)
    assert source_get.status_code == 200
    assert source_get.json["recordingDeviceId"] == "device-a"

    source_gallery = client.get(
        f"/api/gallery?page=1&tag-object-type=RockExplorerFeature&tag-object-id={source_id}",
        token=member_token,
    )
    assert source_gallery.status_code == 200
    source_image_ids = {img["id"] for img in source_gallery.json["items"]}
    assert image_id in source_image_ids

    clone_gallery = client.get(
        f"/api/gallery?page=1&tag-object-type=RockExplorerFeature&tag-object-id={clone['id']}",
        token=member_token,
    )
    assert clone_gallery.status_code == 200
    clone_image_ids = {img["id"] for img in clone_gallery.json["items"]}
    assert image_id in clone_image_ids

    # Source lock unchanged: wrong device still 409 after clone
    wrong_put = client.put(
        f"/api/rock-explorer/features/{source_id}",
        token=member_token,
        json=_draft_payload(recordingDeviceId="device-b", title="hijack via clone"),
    )
    assert wrong_put.status_code == 409

    # Non-owner cannot clone
    denied = client.post(
        f"/api/rock-explorer/features/{source_id}/clone",
        token=admin_token,
        json={"recordingDeviceId": "admin-device"},
    )
    assert denied.status_code == 401


def test_published_create_still_geojson_visible(client, member_token):
    """D-15: omit status (default published); appears in GeoJSON."""
    created = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_published_payload(title="Default published"),
    ).json
    assert created.get("status", "published") == "published"

    geo = client.get("/api/rock-explorer/features.geojson", token=member_token)
    assert geo.status_code == 200
    ids = {f["id"] for f in geo.json["features"]}
    assert created["id"] in ids


def test_gallery_list_draft_tag_denied_for_non_owner(client, member_token, admin_token):
    """T-10-05: non-owner gallery list by draft tag-object-id → 401."""
    draft = client.post("/api/rock-explorer/features", token=member_token, json=_draft_payload()).json

    owner_list = client.get(
        f"/api/gallery?page=1&tag-object-type=RockExplorerFeature&tag-object-id={draft['id']}",
        token=member_token,
    )
    assert owner_list.status_code == 200

    other_list = client.get(
        f"/api/gallery?page=1&tag-object-type=RockExplorerFeature&tag-object-id={draft['id']}",
        token=admin_token,
    )
    assert other_list.status_code == 401


def test_comment_on_others_draft_denied(client, member_token, admin_token):
    """T-10-05: non-owner POST comment targeting draft → 401."""
    draft = client.post("/api/rock-explorer/features", token=member_token, json=_draft_payload()).json

    owner_comment = client.post(
        "/api/comments",
        token=member_token,
        json={
            "message": "Owner note",
            "objectType": "RockExplorerFeature",
            "objectId": draft["id"],
        },
    )
    assert owner_comment.status_code == 201

    other_comment = client.post(
        "/api/comments",
        token=admin_token,
        json={
            "message": "Intruder",
            "objectType": "RockExplorerFeature",
            "objectId": draft["id"],
        },
    )
    assert other_comment.status_code == 401


def test_owner_draft_list_status_filter(client, member_token, admin_token):
    """RE-TRACK-01: owner GET ?status=draft returns own drafts only."""
    mine = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_draft_payload(title="Mine"),
    ).json
    theirs = client.post(
        "/api/rock-explorer/features",
        token=admin_token,
        json=_draft_payload(title="Theirs", recordingDeviceId="admin-device"),
    ).json
    client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_published_payload(title="Published ignore"),
    )

    listed = client.get("/api/rock-explorer/features?status=draft", token=member_token)
    assert listed.status_code == 200
    ids = {f["id"] for f in listed.json}
    assert mine["id"] in ids
    assert theirs["id"] not in ids
    assert all(f["status"] == "draft" for f in listed.json)

    missing_status = client.get("/api/rock-explorer/features", token=member_token)
    assert missing_status.status_code == 400


def test_gallery_create_draft_tag_denied_for_non_owner(client, member_token, admin_token):
    """T-10-05: non-owner POST gallery image tagged to others' draft → 401."""
    draft = client.post("/api/rock-explorer/features", token=member_token, json=_draft_payload()).json
    tag = {"objectType": "RockExplorerFeature", "objectId": draft["id"]}

    owner_ok = client.post(
        "/api/gallery",
        token=member_token,
        json={"fileId": _file_id(), "tags": [tag]},
    )
    assert owner_ok.status_code == 201

    other_denied = client.post(
        "/api/gallery",
        token=admin_token,
        json={"fileId": _file_id(), "tags": [tag]},
    )
    assert other_denied.status_code == 401


def test_published_requires_geometry_and_potential(client, member_token):
    """T-10-06 / D-04: published with null geometry or potential → 400."""
    no_geom = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_published_payload(geometry=None),
    )
    assert no_geom.status_code == 400

    no_potential = client.post(
        "/api/rock-explorer/features",
        token=member_token,
        json=_published_payload(potential=None),
    )
    assert no_potential.status_code == 400

    # Draft → published via PUT without geometry must fail validation
    draft = client.post("/api/rock-explorer/features", token=member_token, json=_draft_payload()).json
    flip = client.put(
        f"/api/rock-explorer/features/{draft['id']}",
        token=member_token,
        json=_draft_payload(status="published", recordingDeviceId=None, recordingState=None),
    )
    assert flip.status_code == 400
