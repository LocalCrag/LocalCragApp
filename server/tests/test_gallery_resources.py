from extensions import db
from models.area import Area
from models.file import File
from models.gallery_image import GalleryImage
from models.secret_topo_entity import SecretTopoEntity
from models.user import User


def _gallery_put_payload(tags, description=None, lat=None, lng=None):
    return {
        "tags": tags,
        "description": description,
        "lat": lat,
        "lng": lng,
    }


def _secret_line_payload():
    return {
        "name": "Gallery Secret Line",
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
        "closureSchedules": [],
    }


def test_secret_gallery_images_excluded_from_global_listing(client, moderator_token, member_token):
    rv = client.get("/api/gallery")
    assert rv.status_code == 200
    public_count = len(rv.json["items"])

    line_data = _secret_line_payload()
    rv = client.post("/api/areas/shark-attack/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    line_id = rv.json["id"]
    assert db.session.get(SecretTopoEntity, line_id) is not None

    file_id = File.query.filter_by(original_filename="Hate it or love it.JPG").first().id
    rv = client.post(
        "/api/gallery",
        token=member_token,
        json={"fileId": file_id, "tags": [{"objectType": "Line", "objectId": line_id}]},
    )
    assert rv.status_code == 201
    secret_image_id = rv.json["id"]

    rv = client.get("/api/gallery")
    assert rv.status_code == 200
    anonymous_ids = {item["id"] for item in rv.json["items"]}
    assert secret_image_id not in anonymous_ids
    assert len(rv.json["items"]) == public_count

    rv = client.get("/api/gallery", token=member_token)
    assert rv.status_code == 200
    member_ids = {item["id"] for item in rv.json["items"]}
    assert secret_image_id in member_ids


def test_secret_gallery_images_tagged_to_secret_area_are_hidden(client, moderator_token, member_token):
    secret_area = Area.find_by_slug("shark-attack")
    secret_area.secret = True
    db.session.commit()
    assert db.session.get(SecretTopoEntity, secret_area.id) is not None

    rv = client.get("/api/gallery")
    assert rv.status_code == 200
    public_count = len(rv.json["items"])

    file_id = File.query.filter_by(original_filename="Hate it or love it.JPG").first().id
    rv = client.post(
        "/api/gallery",
        token=member_token,
        json={"fileId": file_id, "tags": [{"objectType": "Area", "objectId": str(secret_area.id)}]},
    )
    assert rv.status_code == 201
    secret_image_id = rv.json["id"]

    rv = client.get("/api/gallery")
    assert rv.status_code == 200
    assert secret_image_id not in {item["id"] for item in rv.json["items"]}
    assert len(rv.json["items"]) == public_count

    rv = client.get("/api/gallery", token=member_token)
    assert rv.status_code == 200
    assert secret_image_id in {item["id"] for item in rv.json["items"]}


def test_successful_create_gallery_image(client, user_token):
    image_id = File.query.filter_by(original_filename="Love it or leave it.JPG").first().id
    user = User.query.filter_by(email="user@localcrag.invalid.org").first()
    post_data = {"fileId": image_id, "tags": [{"objectType": "User", "objectId": user.id}]}

    rv = client.post("/api/gallery", token=user_token, json=post_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["image"]["id"] == str(image_id)
    assert res.get("createdBy") is not None
    assert "avatar" in res["createdBy"]
    assert res["tags"][0]["objectType"] == "User"
    assert res["tags"][0]["object"]["id"] == str(user.id)
    assert res["id"] is not None
    expected_id = res["id"]

    # Check, that the image is now shown in the user's gallery
    rv = client.get(f"/api/gallery?page=1&tag-object-type=User&tag-object-slug={user.slug}")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 1
    assert res["items"][0]["id"] == expected_id

    # Check, that the image is not shown in the line gallery of e.g. superspreader
    rv = client.get("/api/gallery?page=1&tag-object-type=Line&tag-object-slug=super-spreader")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 1
    assert res["items"][0]["id"] != expected_id

    # Check, that the main gallery shows the image
    rv = client.get("/api/gallery")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 3
    all_ids = [r["id"] for r in res["items"]]
    assert expected_id in all_ids


def test_try_creating_gallery_image_with_invalid_object_type(client, user_token):
    image_id = File.query.filter_by(original_filename="Love it or leave it.JPG").first().id
    post_data = {"fileId": image_id, "tags": [{"objectType": "Invalid", "objectId": image_id}]}  # some valid uuid..

    rv = client.post("/api/gallery", token=user_token, json=post_data)
    assert rv.status_code == 400


def test_try_creating_gallery_image_with_invalid_object_id(client, user_token):
    image_id = File.query.filter_by(original_filename="Love it or leave it.JPG").first().id
    post_data = {
        "fileId": image_id,
        "tags": [{"objectType": "User", "objectId": image_id}],  # Valid UUID, but not belonging to a user
    }

    rv = client.post("/api/gallery", token=user_token, json=post_data)
    assert rv.status_code == 404


def test_get_gallery_images(client):
    rv = client.get("/api/gallery")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2


def test_get_gallery_images_for_line(client):
    rv = client.get("/api/gallery?page=1&tag-object-type=Line&tag-object-slug=super-spreader")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 1
    assert res["items"][0].get("createdBy") is not None
    assert "avatar" in res["items"][0]["createdBy"]
    assert res["items"][0]["tags"][0]["objectType"] == "Line"

    rv = client.get("/api/gallery?page=1&tag-object-type=Line&tag-object-slug=the-vessel")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 0


def test_get_gallery_images_for_crag(client):
    rv = client.get("/api/gallery?page=1&tag-object-type=Crag&tag-object-slug=brione")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 2
    all_object_types = [
        r["tags"][0]["objectType"] for r in res["items"]
    ]  # Both have only 1 tag, so we can just take the first
    assert "Crag" in all_object_types
    assert "Line" in all_object_types


def test_delete_gallery_image_with_moderator(client, moderator_token):
    image_id = GalleryImage.query.first().id
    rv = client.delete(f"/api/gallery/{image_id}", token=moderator_token)
    assert rv.status_code == 204


def test_delete_moderators_gallery_image_with_user(client, user_token):
    gallery_images = GalleryImage.query.all()
    moderator_gallery_image = [gi for gi in gallery_images if gi.tags[0].object_type == "Crag"][0]
    rv = client.delete(f"/api/gallery/{moderator_gallery_image.id}", token=user_token)
    assert rv.status_code == 401


def test_delete_users_gallery_image_with_user(client, user_token):
    gallery_images = GalleryImage.query.all()
    user_gallery_image = [gi for gi in gallery_images if gi.tags[0].object_type == "Line"][0]
    rv = client.delete(f"/api/gallery/{user_gallery_image.id}", token=user_token)
    assert rv.status_code == 204


def test_update_own_gallery_image(client, moderator_token):
    gallery_images = GalleryImage.query.all()
    user_gallery_image = [gi for gi in gallery_images if gi.tags[0].object_type == "Crag"][0]
    user = User.query.filter_by(email="user@localcrag.invalid.org").first()
    put_data = _gallery_put_payload([{"objectType": "User", "objectId": user.id}])
    rv = client.put(f"/api/gallery/{user_gallery_image.id}", token=moderator_token, json=put_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["tags"][0]["objectType"] == "User"
    assert len(res["tags"]) == 1


def test_update_moderator_gallery_image_with_user(client, user_token):
    gallery_images = GalleryImage.query.all()
    moderator_gallery_image = [gi for gi in gallery_images if gi.tags[0].object_type == "Crag"][0]
    user = User.query.filter_by(email="user@localcrag.invalid.org").first()
    put_data = _gallery_put_payload([{"objectType": "User", "objectId": user.id}])
    rv = client.put(f"/api/gallery/{moderator_gallery_image.id}", token=user_token, json=put_data)
    assert rv.status_code == 401


def test_update_users_gallery_image_with_moderator(client, moderator_token):
    gallery_images = GalleryImage.query.all()
    user_gallery_image = [gi for gi in gallery_images if gi.tags[0].object_type == "Line"][0]
    user = User.query.filter_by(email="user@localcrag.invalid.org").first()
    put_data = _gallery_put_payload([{"objectType": "User", "objectId": user.id}])
    rv = client.put(f"/api/gallery/{user_gallery_image.id}", token=moderator_token, json=put_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["tags"][0]["objectType"] == "User"
    assert len(res["tags"]) == 1


# --- Rock explorer gallery access-control tests ------------------------------------------------


def _create_rock_explorer_feature():
    from extensions import db
    from models.rock_explorer_feature import RockExplorerFeature

    feature = RockExplorerFeature()
    feature.title = "Gallery feature"
    feature.geometry = {"type": "Point", "coordinates": [8.1, 50.2]}
    db.session.add(feature)
    db.session.commit()
    return feature


def _file_id():
    return File.query.filter_by(original_filename="Hate it or love it.JPG").first().id


def test_rock_explorer_member_can_create_gallery_image_for_feature(client, member_token):
    feature = _create_rock_explorer_feature()

    rv = client.post(
        "/api/gallery",
        token=member_token,
        json={"fileId": _file_id(), "tags": [{"objectType": "RockExplorerFeature", "objectId": str(feature.id)}]},
    )
    assert rv.status_code == 201
    assert rv.json["tags"][0]["objectType"] == "RockExplorerFeature"
    assert rv.json["tags"][0]["object"]["id"] == str(feature.id)
    assert rv.json["tags"][0]["object"]["title"] == feature.title


def test_rock_explorer_gating_does_not_block_regular_uploads(client, user_token):
    user = User.query.filter_by(email="user@localcrag.invalid.org").first()

    rv = client.post(
        "/api/gallery",
        token=user_token,
        json={"fileId": _file_id(), "tags": [{"objectType": "User", "objectId": str(user.id)}]},
    )
    assert rv.status_code == 201


def test_rock_explorer_member_can_list_images_by_tag_object_id(client, member_token):
    feature = _create_rock_explorer_feature()

    rv = client.post(
        "/api/gallery",
        token=member_token,
        json={"fileId": _file_id(), "tags": [{"objectType": "RockExplorerFeature", "objectId": str(feature.id)}]},
    )
    assert rv.status_code == 201
    image_id = rv.json["id"]

    rv = client.get(
        f"/api/gallery?page=1&tag-object-type=RockExplorerFeature&tag-object-id={feature.id}",
        token=member_token,
    )
    assert rv.status_code == 200
    assert [item["id"] for item in rv.json["items"]] == [image_id]


def test_rock_explorer_anonymous_and_non_member_cannot_list_images_by_tag(client, user_token):
    feature = _create_rock_explorer_feature()

    url_feature = f"/api/gallery?page=1&tag-object-type=RockExplorerFeature&tag-object-id={feature.id}"
    rv = client.get(url_feature)
    assert rv.status_code == 401
    rv = client.get(url_feature, token=user_token)
    assert rv.status_code == 401


def test_rock_explorer_tag_listing_requires_tag_object_id(client, member_token):
    rv = client.get("/api/gallery?page=1&tag-object-type=RockExplorerFeature", token=member_token)
    assert rv.status_code == 400


def test_rock_explorer_images_excluded_from_unfiltered_gallery(client, member_token, user_token):
    """Region gallery never lists rock explorer images (issue #1246), including for members."""
    feature = _create_rock_explorer_feature()

    rv = client.get("/api/gallery")
    assert rv.status_code == 200
    baseline_count = len(rv.json["items"])

    rv = client.post(
        "/api/gallery",
        token=member_token,
        json={"fileId": _file_id(), "tags": [{"objectType": "RockExplorerFeature", "objectId": str(feature.id)}]},
    )
    assert rv.status_code == 201
    new_image_id = rv.json["id"]

    for token in (None, user_token, member_token):
        rv = client.get("/api/gallery", token=token) if token else client.get("/api/gallery")
        assert rv.status_code == 200
        assert len(rv.json["items"]) == baseline_count
        assert new_image_id not in {item["id"] for item in rv.json["items"]}

    rv = client.get(
        f"/api/gallery?page=1&tag-object-type=RockExplorerFeature&tag-object-id={feature.id}",
        token=member_token,
    )
    assert rv.status_code == 200
    assert new_image_id in {item["id"] for item in rv.json["items"]}


def test_update_gallery_image_gps_coordinates(client, member_token):
    feature = _create_rock_explorer_feature()
    feature_tag = {"objectType": "RockExplorerFeature", "objectId": str(feature.id)}

    rv = client.post(
        "/api/gallery",
        token=member_token,
        json={
            "fileId": _file_id(),
            "tags": [feature_tag],
        },
    )
    assert rv.status_code == 201
    image_id = rv.json["id"]
    assert rv.json["lat"] is None
    assert rv.json["lng"] is None
    assert "lat" not in rv.json["image"]
    assert "lng" not in rv.json["image"]

    rv = client.put(
        f"/api/gallery/{image_id}",
        token=member_token,
        json=_gallery_put_payload([feature_tag], lat=50.123456, lng=8.654321),
    )
    assert rv.status_code == 200
    assert rv.json["lat"] == 50.123456
    assert rv.json["lng"] == 8.654321

    image = GalleryImage.query.filter_by(id=image_id).first()
    assert image.lat == 50.123456
    assert image.lng == 8.654321
    # Manual geotag must not overwrite upload EXIF on the file.
    assert image.file.exif_lat is None
    assert image.file.exif_lng is None

    rv = client.put(
        f"/api/gallery/{image_id}",
        token=member_token,
        json=_gallery_put_payload([feature_tag], lat=None, lng=None),
    )
    assert rv.status_code == 200
    assert rv.json["lat"] is None
    assert rv.json["lng"] is None

    rv = client.put(
        f"/api/gallery/{image_id}",
        token=member_token,
        json=_gallery_put_payload([feature_tag], lat=50.1, lng=None),
    )
    assert rv.status_code == 400
