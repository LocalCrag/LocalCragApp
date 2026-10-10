import base64
import hashlib

from botocore.exceptions import ClientError
from flask import current_app

from extensions import db
from models.file import File
from uploader.do_s3 import get_s3_client
from uploader.file_storage import (
    delete_unreferenced_storage_objects,
    referenced_storage_keys,
    storage_keys_for_deleted_file,
    thumbnail_storage_key,
)


def _bucket():
    return current_app.config["S3_BUCKET"]


def _put(s3_mock, key):
    s3_mock.put_object(Bucket=_bucket(), Key=key, Body=b"x")


def _exists(s3_mock, key):
    try:
        s3_mock.head_object(Bucket=_bucket(), Key=key)
    except ClientError:
        return False
    return True


def test_thumbnail_key_matches_client_suffix_rule():
    assert thumbnail_storage_key("abc123.jpeg", "xs") == "abc123_xs.jpeg"
    assert thumbnail_storage_key("name.with.dots.png", "l") == "name.with.dots_l.png"


def test_referenced_keys_include_only_flagged_thumbnails():
    keys = referenced_storage_keys(
        [
            {
                "filename": "keep.jpeg",
                "thumbnail_xs": True,
                "thumbnail_s": False,
                "thumbnail_m": None,
                "thumbnail_l": False,
                "thumbnail_xl": True,
            }
        ]
    )
    assert keys == {"keep.jpeg", "keep_xs.jpeg", "keep_xl.jpeg"}


def test_deleted_file_keys_cover_every_thumbnail_size():
    assert storage_keys_for_deleted_file("abc.jpeg") == {
        "abc.jpeg",
        "abc_xs.jpeg",
        "abc_s.jpeg",
        "abc_m.jpeg",
        "abc_l.jpeg",
        "abc_xl.jpeg",
    }
    assert storage_keys_for_deleted_file(None) == set()


def test_deleting_file_row_removes_storage_objects(s3_mock):
    file = File()
    file.original_filename = "cleanup.jpg"
    file.filename = "cleanup-target.jpeg"
    file.thumbnail_xs = True
    file.thumbnail_s = False
    db.session.add(file)
    db.session.commit()

    for key in storage_keys_for_deleted_file(file.filename):
        _put(s3_mock, key)
    _put(s3_mock, "unrelated-keep.txt")

    db.session.delete(file)
    db.session.commit()

    for key in storage_keys_for_deleted_file("cleanup-target.jpeg"):
        assert not _exists(s3_mock, key)
    assert _exists(s3_mock, "unrelated-keep.txt")
    assert File.query.filter_by(filename="cleanup-target.jpeg").first() is None


def test_rolled_back_file_delete_keeps_storage_objects(s3_mock):
    file = File()
    file.original_filename = "keep.jpg"
    file.filename = "rollback-target.jpeg"
    file.thumbnail_xs = True
    db.session.add(file)
    db.session.commit()
    _put(s3_mock, file.filename)
    _put(s3_mock, thumbnail_storage_key(file.filename, "xs"))

    nested = db.session.begin_nested()
    db.session.delete(file)
    db.session.flush()
    nested.rollback()

    assert _exists(s3_mock, "rollback-target.jpeg")
    assert _exists(s3_mock, "rollback-target_xs.jpeg")
    assert File.query.filter_by(filename="rollback-target.jpeg").first() is not None

    db.session.commit()
    assert _exists(s3_mock, "rollback-target.jpeg")
    assert _exists(s3_mock, "rollback-target_xs.jpeg")


def test_orphan_cleanup_deletes_unreferenced_objects_only(s3_mock):
    file = File()
    file.original_filename = "keep.jpg"
    file.filename = "referenced-keep.jpeg"
    file.thumbnail_xs = True
    file.thumbnail_s = False
    file.thumbnail_m = False
    file.thumbnail_l = False
    file.thumbnail_xl = False
    db.session.add(file)
    db.session.commit()

    filename = file.filename
    referenced = {filename, thumbnail_storage_key(filename, "xs")}
    for key in referenced:
        _put(s3_mock, key)
    _put(s3_mock, thumbnail_storage_key(filename, "xl"))
    _put(s3_mock, "orphan-not-in-db.jpg")

    deleted = delete_unreferenced_storage_objects(referenced_storage_keys(File.query.all()))

    assert deleted == 2
    for key in referenced:
        assert _exists(s3_mock, key)
    assert not _exists(s3_mock, thumbnail_storage_key(filename, "xl"))
    assert not _exists(s3_mock, "orphan-not-in-db.jpg")


def test_delete_objects_sends_content_md5(s3_mock):
    client = get_s3_client()
    captured = {}

    def capture(request, **kwargs):
        captured["md5"] = request.headers.get("Content-MD5")
        captured["crc"] = request.headers.get("x-amz-checksum-crc32")
        captured["body"] = request.body

    client.meta.events.register("before-sign.s3.DeleteObjects", capture)
    client.delete_objects(
        Bucket=_bucket(),
        Delete={"Objects": [{"Key": "orphan.jpeg"}], "Quiet": True},
    )

    body = captured["body"]
    if isinstance(body, str):
        body = body.encode("utf-8")
    expected = base64.b64encode(hashlib.md5(body, usedforsecurity=False).digest()).decode("ascii")
    assert captured["md5"] == expected
    assert captured["crc"] is None
