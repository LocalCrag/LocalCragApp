import os

from flask import current_app
from werkzeug.datastructures import FileStorage

from extensions import db
from models.file import File
from models.user import User


def _upload_test_image(client, token):
    upload_image = (
        FileStorage(
            stream=open(os.path.join("../tests/assets/test_image_271_186.jpeg"), "rb"),
            filename="test_image_271_186.jpeg",
            content_type="image/jpeg",
        ),
    )
    rv = client.post(
        "/api/upload",
        token=token,
        data={"upload": upload_image},
        content_type="multipart/form-data",
    )
    assert rv.status_code == 201
    return rv.json[0]


def test_update_file_focus(client, any_file, moderator_token):
    rv = client.patch(
        f"/api/files/{any_file.id}",
        token=moderator_token,
        json={"focusY": 0.35},
    )
    assert rv.status_code == 200
    assert rv.json["focusY"] == 0.35


def test_clear_file_focus(client, any_file, moderator_token):
    client.patch(
        f"/api/files/{any_file.id}",
        token=moderator_token,
        json={"focusY": 0.35},
    )
    rv = client.patch(
        f"/api/files/{any_file.id}",
        token=moderator_token,
        json={"focusY": None},
    )
    assert rv.status_code == 200
    assert rv.json["focusY"] is None


def test_transform_image_rotates_and_keeps_original(client, user_token, s3_mock):
    uploaded = _upload_test_image(client, user_token)
    source = File.query.get(uploaded["id"])
    source.exif_lat = 50.1
    source.exif_lng = 7.2
    db.session.commit()

    rv = client.post(
        f"/api/files/{uploaded['id']}/transform",
        token=user_token,
        json={"rotation": 90, "crop": None},
    )
    assert rv.status_code == 201
    transformed = rv.json
    assert transformed["id"] != uploaded["id"]
    assert transformed["width"] == uploaded["height"]
    assert transformed["height"] == uploaded["width"]
    assert transformed["originalFilename"] == uploaded["originalFilename"]
    assert File.query.get(uploaded["id"]) is not None
    stored = File.query.get(transformed["id"])
    assert stored.exif_lat == 50.1
    assert stored.exif_lng == 7.2
    assert s3_mock.get_object(Bucket=current_app.config["S3_BUCKET"], Key=stored.filename) is not None
    assert s3_mock.get_object(Bucket=current_app.config["S3_BUCKET"], Key=source.filename) is not None


def test_transform_image_crops(client, user_token, s3_mock):
    uploaded = _upload_test_image(client, user_token)
    rv = client.post(
        f"/api/files/{uploaded['id']}/transform",
        token=user_token,
        json={"rotation": 0, "crop": {"x": 10, "y": 20, "width": 50, "height": 40}},
    )
    assert rv.status_code == 201
    assert rv.json["width"] == 50
    assert rv.json["height"] == 40
    assert rv.json["id"] != uploaded["id"]
    assert uploaded["createdById"] == str(User.find_by_email("user@localcrag.invalid.org").id)


def test_transform_image_noop_returns_same_file(client, user_token, s3_mock):
    uploaded = _upload_test_image(client, user_token)
    rv = client.post(
        f"/api/files/{uploaded['id']}/transform",
        token=user_token,
        json={"rotation": 0, "crop": {"x": 0, "y": 0, "width": 271, "height": 186}},
    )
    assert rv.status_code == 200
    assert rv.json["id"] == uploaded["id"]


def test_transform_rejects_non_image(client, user_token, s3_mock):
    upload_file = (
        FileStorage(
            stream=open(os.path.join("../tests/assets/test_pdf.pdf"), "rb"),
            filename="test_pdf.pdf",
            content_type="application/pdf",
        ),
    )
    uploaded = client.post(
        "/api/upload",
        token=user_token,
        data={"upload": upload_file},
        content_type="multipart/form-data",
    )
    assert uploaded.status_code == 201
    rv = client.post(
        f"/api/files/{uploaded.json[0]['id']}/transform",
        token=user_token,
        json={"rotation": 90},
    )
    assert rv.status_code == 400
    assert rv.json["message"] == "INVALID_IMAGE_TRANSFORM"


def test_transform_rejects_another_users_file(client, user_token, member_token, s3_mock):
    uploaded = _upload_test_image(client, user_token)
    rv = client.post(
        f"/api/files/{uploaded['id']}/transform",
        token=member_token,
        json={"rotation": 90},
    )
    assert rv.status_code == 403
    assert rv.json["message"] == "FORBIDDEN"


def test_moderator_can_transform_another_users_file(client, user_token, moderator_token, s3_mock):
    uploaded = _upload_test_image(client, user_token)
    rv = client.post(
        f"/api/files/{uploaded['id']}/transform",
        token=moderator_token,
        json={"rotation": 90},
    )
    assert rv.status_code == 201
    assert rv.json["id"] != uploaded["id"]


def test_file_without_creator_is_staff_only(client, user_token, moderator_token, s3_mock):
    uploaded = _upload_test_image(client, user_token)
    source = File.query.get(uploaded["id"])
    source.created_by_id = None
    db.session.commit()

    denied = client.post(
        f"/api/files/{uploaded['id']}/transform",
        token=user_token,
        json={"rotation": 90},
    )
    assert denied.status_code == 403

    allowed = client.post(
        f"/api/files/{uploaded['id']}/transform",
        token=moderator_token,
        json={"rotation": 90},
    )
    assert allowed.status_code == 201


def test_transform_requires_login(client, user_token, s3_mock):
    uploaded = _upload_test_image(client, user_token)
    rv = client.post(
        f"/api/files/{uploaded['id']}/transform",
        json={"rotation": 90},
    )
    assert rv.status_code == 401
