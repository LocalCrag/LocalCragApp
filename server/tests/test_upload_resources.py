import os

import pytest
from flask import current_app
from werkzeug.datastructures import FileStorage


def test_successful_file_upload(client, clean_test_uploads, s3_mock, moderator_token):
    upload_file = (
        FileStorage(
            stream=open(os.path.join("../tests/assets/test_pdf.pdf"), "rb"),
            filename="test_pdf.pdf",
            content_type="application/pdf",
        ),
    )
    rv = client.post(
        "/api/upload", token=moderator_token, data={"upload": upload_file}, content_type="multipart/form-data"
    )
    assert rv.status_code == 201
    res = rv.json
    assert isinstance(res["filename"], str)
    assert res["originalFilename"] == "test_pdf.pdf"
    assert isinstance(res["id"], str)
    assert s3_mock.get_object(Bucket=current_app.config["S3_BUCKET"], Key=res["filename"]) is not None
    assert res["width"] is None
    assert res["height"] is None
    assert res["thumbnailXS"] is None
    assert res["thumbnailS"] is None
    assert res["thumbnailM"] is None
    assert res["thumbnailL"] is None
    assert res["thumbnailXL"] is None


def test_file_upload_too_large_file(client, clean_test_uploads, s3_mock, moderator_token):
    upload_image = (
        FileStorage(
            stream=open(os.path.join("../tests/assets/test_image_large_filesize.jpg"), "rb"),
            filename="test_image_large_filesize.jpg",
            content_type="image/jpg",
        ),
    )
    rv = client.post(
        "/api/upload", token=moderator_token, data={"upload": upload_image}, content_type="multipart/form-data"
    )
    assert rv.status_code == 400
    res = rv.json
    assert res["message"] == "FILESIZE_LIMIT_EXCEEDED"
    with pytest.raises(Exception):
        s3_mock.get_object(Bucket=current_app.config["S3_BUCKET"], Key="test-uuid.jpg")


def test_successful_upload_small(client, clean_test_uploads, s3_mock, moderator_token):
    upload_image = (
        FileStorage(
            stream=open(os.path.join("../tests/assets/test_image_271_186.jpeg"), "rb"),
            filename="test_image_271_186.jpeg",
            content_type="image/jpg",
        ),
    )
    rv = client.post(
        "/api/upload", token=moderator_token, data={"upload": upload_image}, content_type="multipart/form-data"
    )
    assert rv.status_code == 201
    res = rv.json
    assert res["height"] == 186
    assert res["width"] == 271
    assert isinstance(res["filename"], str)
    assert res["originalFilename"] == "test_image_271_186.jpeg"
    assert isinstance(res["id"], str)
    assert res["thumbnailXS"] is True
    assert res["thumbnailS"] is True
    assert res["thumbnailM"] is False
    assert res["thumbnailL"] is False
    assert res["thumbnailXL"] is False
    filename_parts = res["filename"].split(".")
    assert s3_mock.get_object(Bucket=current_app.config["S3_BUCKET"], Key=res["filename"]) is not None
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xs.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_s.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_m.{}".format(filename_parts[0], filename_parts[1])
        )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_l.{}".format(filename_parts[0], filename_parts[1])
        )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xl.{}".format(filename_parts[0], filename_parts[1])
        )


def test_successful_upload_medium(client, clean_test_uploads, s3_mock, moderator_token):
    upload_image = (
        FileStorage(
            stream=open(os.path.join("../tests/assets/test_image_512_512.jpg"), "rb"),
            filename="test_image_512_512.jpg",
            content_type="image/jpg",
        ),
    )
    rv = client.post(
        "/api/upload", token=moderator_token, data={"upload": upload_image}, content_type="multipart/form-data"
    )
    assert rv.status_code == 201
    res = rv.json
    assert res["height"] == 512
    assert res["width"] == 512
    assert isinstance(res["filename"], str)
    assert res["originalFilename"] == "test_image_512_512.jpg"
    assert isinstance(res["id"], str)
    assert res["thumbnailXS"] is True
    assert res["thumbnailS"] is True
    assert res["thumbnailM"] is True
    assert res["thumbnailL"] is False
    assert res["thumbnailXL"] is False
    filename_parts = res["filename"].split(".")
    assert s3_mock.get_object(Bucket=current_app.config["S3_BUCKET"], Key=res["filename"]) is not None
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xs.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_s.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_m.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_l.{}".format(filename_parts[0], filename_parts[1])
        )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xl.{}".format(filename_parts[0], filename_parts[1])
        )


def test_successful_upload_large(client, clean_test_uploads, s3_mock, moderator_token):
    upload_image = (
        FileStorage(
            stream=open(os.path.join("../tests/assets/test_image_4000_2667.jpg"), "rb"),
            filename="test_image_4000_2667.jpg",
            content_type="image/jpeg",
        ),
    )
    rv = client.post(
        "/api/upload", token=moderator_token, data={"upload": upload_image}, content_type="multipart/form-data"
    )
    assert rv.status_code == 201
    res = rv.json
    assert res["height"] == 2667
    assert res["width"] == 4000
    assert isinstance(res["filename"], str)
    assert res["originalFilename"] == "test_image_4000_2667.jpg"
    assert isinstance(res["id"], str)
    assert res["thumbnailXS"] is True
    assert res["thumbnailS"] is True
    assert res["thumbnailM"] is True
    assert res["thumbnailL"] is True
    assert res["thumbnailXL"] is True
    filename_parts = res["filename"].split(".")
    assert s3_mock.get_object(Bucket=current_app.config["S3_BUCKET"], Key=res["filename"]) is not None
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xs.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_s.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_m.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_l.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xl.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )


def test_upload_too_large_file(client, clean_test_uploads, s3_mock, moderator_token):
    upload_image = (
        FileStorage(
            stream=open(os.path.join("../tests/assets/test_image_large_filesize.jpg"), "rb"),
            filename="test_image_large_filesize.jpg",
            content_type="image/jpg",
        ),
    )
    rv = client.post(
        "/api/upload", token=moderator_token, data={"upload": upload_image}, content_type="multipart/form-data"
    )
    assert rv.status_code == 400
    res = rv.json
    assert res["message"] == "FILESIZE_LIMIT_EXCEEDED"


def test_successful_upload_small_png(client, clean_test_uploads, s3_mock, moderator_token):
    upload_image = (
        FileStorage(
            stream=open(os.path.join("../tests/assets/test_image_271_186.png"), "rb"),
            filename="test_image_271_186.png",
            content_type="image/png",
        ),
    )
    rv = client.post(
        "/api/upload", token=moderator_token, data={"upload": upload_image}, content_type="multipart/form-data"
    )
    assert rv.status_code == 201
    res = rv.json
    assert res["height"] == 186
    assert res["width"] == 271
    assert isinstance(res["filename"], str)
    assert res["originalFilename"] == "test_image_271_186.png"
    assert isinstance(res["id"], str)
    assert res["thumbnailXS"] is True
    assert res["thumbnailS"] is True
    assert res["thumbnailM"] is False
    assert res["thumbnailL"] is False
    assert res["thumbnailXL"] is False
    filename_parts = res["filename"].split(".")
    assert s3_mock.get_object(Bucket=current_app.config["S3_BUCKET"], Key=res["filename"]) is not None
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xs.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_s.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_m.{}".format(filename_parts[0], filename_parts[1])
        )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_l.{}".format(filename_parts[0], filename_parts[1])
        )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xl.{}".format(filename_parts[0], filename_parts[1])
        )


def test_successful_upload_small_gif(client, clean_test_uploads, s3_mock, moderator_token):
    upload_image = (
        FileStorage(
            stream=open(os.path.join("../tests/assets/test_image_271_186.gif"), "rb"),
            filename="test_image_271_186.gif",
            content_type="image/gif",
        ),
    )
    rv = client.post(
        "/api/upload", token=moderator_token, data={"upload": upload_image}, content_type="multipart/form-data"
    )
    assert rv.status_code == 201
    res = rv.json
    assert res["height"] == 186
    assert res["width"] == 271
    assert isinstance(res["filename"], str)
    assert res["originalFilename"] == "test_image_271_186.gif"
    assert isinstance(res["id"], str)
    assert res["thumbnailXS"] is True
    assert res["thumbnailS"] is True
    assert res["thumbnailM"] is False
    assert res["thumbnailL"] is False
    assert res["thumbnailXL"] is False
    filename_parts = res["filename"].split(".")
    assert s3_mock.get_object(Bucket=current_app.config["S3_BUCKET"], Key=res["filename"]) is not None
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xs.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_s.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_m.{}".format(filename_parts[0], filename_parts[1])
        )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_l.{}".format(filename_parts[0], filename_parts[1])
        )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xl.{}".format(filename_parts[0], filename_parts[1])
        )


def test_successful_upload_small_bmp(client, clean_test_uploads, s3_mock, moderator_token):
    upload_image = (
        FileStorage(
            stream=open(os.path.join("../tests/assets/test_image_271_186.bmp"), "rb"),
            filename="test_image_271_186.bmp",
            content_type="image/bmp",
        ),
    )
    rv = client.post(
        "/api/upload", token=moderator_token, data={"upload": upload_image}, content_type="multipart/form-data"
    )
    assert rv.status_code == 201
    res = rv.json
    assert res["height"] == 186
    assert res["width"] == 271
    assert isinstance(res["filename"], str)
    assert res["originalFilename"] == "test_image_271_186.bmp"
    assert isinstance(res["id"], str)
    assert res["thumbnailXS"] is True
    assert res["thumbnailS"] is True
    assert res["thumbnailM"] is False
    assert res["thumbnailL"] is False
    assert res["thumbnailXL"] is False
    filename_parts = res["filename"].split(".")
    assert s3_mock.get_object(Bucket=current_app.config["S3_BUCKET"], Key=res["filename"]) is not None
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xs.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    assert (
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_s.{}".format(filename_parts[0], filename_parts[1])
        )
        is not None
    )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_m.{}".format(filename_parts[0], filename_parts[1])
        )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_l.{}".format(filename_parts[0], filename_parts[1])
        )
    with pytest.raises(Exception):
        s3_mock.get_object(
            Bucket=current_app.config["S3_BUCKET"], Key="{}_xl.{}".format(filename_parts[0], filename_parts[1])
        )
