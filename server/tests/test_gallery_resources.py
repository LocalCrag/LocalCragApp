from uuid import uuid4

from models.file import File
from models.gallery_image import GalleryImage
from models.tag import Tag
from models.user import User


def test_successful_create_gallery_image(client, user_token):
    image_id = File.query.filter_by(original_filename="Love it or leave it.JPG").first().id
    user = User.query.filter_by(email="user@localcrag.invalid.org").first()
    post_data = {
        "fileId": image_id,
        "tags": [
            {
                "objectType": "User",
                "objectId": user.id
            }
        ]
    }

    rv = client.post("/api/gallery", token=user_token, json=post_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["image"]["id"] == str(image_id)
    assert res["tags"][0]["objectType"] == "User"
    assert res["tags"][0]["object"]["id"] == str(user.id)
    assert res["id"] is not None
    expected_id = res["id"]

    # Check, that the image is now shown in the user's gallery
    rv = client.get(f"/api/gallery?tag-object-type=User&tag-object-slug={user.slug}")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 1
    assert res[0]["id"] == expected_id

    # Check, that the image is not shown in the line gallery of e.g. superspreader
    rv = client.get(f"/api/gallery?tag-object-type=Line&tag-object-slug=super-spreader")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 1
    assert res[0]["id"] != expected_id

    # Check, that the main gallery shows the image
    rv = client.get("/api/gallery")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 3
    all_ids = [r["id"] for r in res]
    assert expected_id in all_ids

def test_try_creating_gallery_image_with_invalid_object_type(client, user_token):
    image_id = File.query.filter_by(original_filename="Love it or leave it.JPG").first().id
    post_data = {
        "fileId": image_id,
        "tags": [
            {
                "objectType": "Invalid",
                "objectId": image_id # some valid uuid..
            }
        ]
    }

    rv = client.post("/api/gallery", token=user_token, json=post_data)
    assert rv.status_code == 400

def test_try_creating_gallery_image_with_invalid_object_id(client, user_token):
    image_id = File.query.filter_by(original_filename="Love it or leave it.JPG").first().id
    post_data = {
        "fileId": image_id,
        "tags": [
            {
                "objectType": "User",
                "objectId": image_id # Valid UUID, but not belonging to a user
            }
        ]
    }

    rv = client.post("/api/gallery", token=user_token, json=post_data)
    assert rv.status_code == 404

def test_get_gallery_images(client):
    rv = client.get("/api/gallery")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2

def test_get_gallery_images_for_line(client):
    rv = client.get("/api/gallery?tag-object-type=Line&tag-object-slug=super-spreader")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 1
    assert res[0]["tags"][0]['objectType'] == "Line"

    rv = client.get("/api/gallery?tag-object-type=Line&tag-object-slug=treppe")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 0

def test_get_gallery_images_for_crag(client):
    rv = client.get("/api/gallery?tag-object-type=Crag&tag-object-slug=brione")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
    all_object_types = [r["tags"][0]['objectType'] for r in res] # Both have only 1 tag, so we can just take the first
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
    put_data = {
        "tags": [
            {
                "objectType": "User",
                "objectId": user.id
            }
        ]
    }
    rv = client.put(f"/api/gallery/{user_gallery_image.id}", token=moderator_token, json=put_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["tags"][0]["objectType"] == "User"
    assert len(res["tags"]) == 1

def test_update_moderator_gallery_image_with_user(client, user_token):
    gallery_images = GalleryImage.query.all()
    moderator_gallery_image = [gi for gi in gallery_images if gi.tags[0].object_type == "Crag"][0]
    user = User.query.filter_by(email="user@localcrag.invalid.org").first()
    put_data = {
        "tags": [
            {
                "objectType": "User",
                "objectId": user.id
            }
        ]
    }
    rv = client.put(f"/api/gallery/{moderator_gallery_image.id}", token=user_token, json=put_data)
    assert rv.status_code == 401

def test_update_users_gallery_image_with_moderator(client, moderator_token):
    gallery_images = GalleryImage.query.all()
    user_gallery_image = [gi for gi in gallery_images if gi.tags[0].object_type == "Line"][0]
    user = User.query.filter_by(email="user@localcrag.invalid.org").first()
    put_data = {
        "tags": [
            {
                "objectType": "User",
                "objectId": user.id
            }
        ]
    }
    rv = client.put(f"/api/gallery/{user_gallery_image.id}", token=moderator_token, json=put_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["tags"][0]["objectType"] == "User"
    assert len(res["tags"]) == 1