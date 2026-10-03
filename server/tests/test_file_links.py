from datetime import datetime, timedelta

import pytz
from apscheduler.triggers.cron import CronTrigger
from botocore.exceptions import ClientError
from flask import current_app
from sqlalchemy import text

from extensions import db
from models.admin_message import AdminMessage
from models.area import Area
from models.ascent import Ascent
from models.closure_schedule import ClosureSchedule
from models.comment import Comment
from models.crag import Crag
from models.file import File
from models.file_link import FileLink
from models.gallery_image import GalleryImage
from models.line import Line
from models.map_marker import MapMarker
from models.menu_page import MenuPage
from models.moderator_task import ModeratorTask
from models.post import Post
from models.region import Region
from models.rock_explorer_feature import RockExplorerFeature
from models.sector import Sector
from models.topo_image import TopoImage
from models.user import User
from uploader.file_storage import storage_keys_for_deleted_file
from util.file_links import (
    backfill_file_links,
    delete_unattached_file_rows,
    delete_unattached_files,
    embedded_file_fields,
    file_reference_tables,
    original_filenames_in_html,
)

_FILENAME = "0123456789abcdef0123456789abcdef.jpeg"


def test_file_owners_are_discovered_from_mapped_models(client):
    fields = {model: set(names) for model, names in embedded_file_fields().items()}
    assert fields == {
        Region: {"description", "rules"},
        Crag: {"short_description", "description", "rules"},
        Sector: {"short_description", "description", "rules"},
        Area: {"short_description", "description"},
        Line: {"description"},
        Post: {"text"},
        MenuPage: {"text"},
        ModeratorTask: {"description"},
        TopoImage: {"description"},
        MapMarker: {"description"},
        GalleryImage: {"description"},
        AdminMessage: {"text"},
        RockExplorerFeature: {"description"},
        Comment: {"message"},
        Ascent: {"comment"},
        ClosureSchedule: {"reason"},
    }
    references = set(file_reference_tables())
    assert references == {
        ("gallery_images", "file_id"),
        ("topo_images", "file_id"),
        ("users", "avatar_id"),
        ("regions", "image_id"),
        ("crags", "portrait_image_id"),
        ("sectors", "portrait_image_id"),
        ("areas", "portrait_image_id"),
        ("instance_settings", "logo_image_id"),
        ("instance_settings", "dark_logo_image_id"),
        ("instance_settings", "favicon_image_id"),
        ("instance_settings", "bg_image_id"),
    }


def _html_for(filename):
    stem, extension = filename.rsplit(".", 1)
    return f'<p><img src="https://cdn.example/bucket/{stem}_xl.{extension}"></p>'


def _file(filename, days_old):
    row = File()
    row.original_filename = "embedded.jpg"
    row.filename = filename
    row.time_created = datetime.now(pytz.utc).replace(tzinfo=None) - timedelta(days=days_old)
    db.session.add(row)
    db.session.flush()
    return row


def _exists(s3_mock, key):
    try:
        s3_mock.head_object(Bucket=current_app.config["S3_BUCKET"], Key=key)
    except ClientError:
        return False
    return True


def test_original_filenames_follow_thumbnail_urls_back_to_the_stored_name():
    html = (
        '<img src="https://cdn.example/bucket/0123456789abcdef0123456789abcdef_xl.jpeg">'
        '<img srcset="https://cdn.example/bucket/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa_s.png 100w">'
    )
    assert original_filenames_in_html(html) == {
        "0123456789abcdef0123456789abcdef.jpeg",
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png",
    }


def test_saving_rich_text_writes_and_replaces_file_links():
    region = Region.query.first()
    row = _file(_FILENAME, days_old=0)
    region.description = _html_for(row.filename)
    db.session.commit()

    link = FileLink.query.filter_by(object_type="Region", object_id=region.id, field_name="description").one()
    assert link.file_id == row.id
    assert link.object.id == region.id

    region.description = "<p>No image.</p>"
    db.session.commit()
    assert FileLink.query.filter_by(object_id=region.id, field_name="description").count() == 0


def test_deleting_the_owner_removes_its_file_links():
    row = _file("abcdefabcdefabcdefabcdefabcdefab.jpeg", days_old=0)
    post = Post()
    post.title = "File link owner"
    post.text = _html_for(row.filename)
    db.session.add(post)
    db.session.commit()
    assert FileLink.query.filter_by(object_id=post.id, field_name="text").count() == 1

    db.session.delete(post)
    db.session.commit()
    assert FileLink.query.filter_by(object_id=post.id).count() == 0


def test_backfill_links_filenames_already_stored_in_html():
    region = Region.query.first()
    row = _file("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.jpeg", days_old=3)
    html = _html_for(row.filename)
    db.session.execute(
        text("UPDATE regions SET description = :html WHERE id = :id"),
        {"html": html, "id": region.id},
    )
    db.session.commit()
    FileLink.query.filter_by(object_id=region.id, field_name="description").delete()
    db.session.commit()

    inserted = backfill_file_links(db.session.connection())

    assert inserted == 1
    link = FileLink.query.filter_by(object_id=region.id, field_name="description").one()
    assert link.file_id == row.id


def test_cleanup_keeps_linked_and_foreign_key_files_and_deletes_old_unattached(s3_mock):
    region = Region.query.first()
    user = User.query.first()
    linked = _file("cccccccccccccccccccccccccccccccc.jpeg", days_old=8)
    attached = _file("dddddddddddddddddddddddddddddddd.jpeg", days_old=8)
    orphan = _file("eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.jpeg", days_old=8)
    recent = _file("ffffffffffffffffffffffffffffffff.jpeg", days_old=0)
    region.description = _html_for(linked.filename)
    user.avatar_id = attached.id
    db.session.commit()

    for key in storage_keys_for_deleted_file(orphan.filename):
        s3_mock.put_object(Bucket=current_app.config["S3_BUCKET"], Key=key, Body=b"x")

    deleted = delete_unattached_files()

    assert deleted == 1
    assert db.session.get(File, linked.id) is not None
    assert db.session.get(File, attached.id) is not None
    assert db.session.get(File, recent.id) is not None
    assert db.session.get(File, orphan.id) is None
    for key in storage_keys_for_deleted_file(orphan.filename):
        assert not _exists(s3_mock, key)


def test_connection_cleanup_returns_only_unattached_filenames():
    region = Region.query.first()
    linked = _file("11111111111111111111111111111111.jpeg", days_old=8)
    orphan = _file("22222222222222222222222222222222.jpeg", days_old=8)
    linked_name = linked.filename
    orphan_name = orphan.filename
    region.description = _html_for(linked_name)
    db.session.commit()

    filenames = delete_unattached_file_rows(db.session.connection())

    assert orphan_name in filenames
    assert linked_name not in filenames


def test_unattached_file_cleanup_is_scheduled_daily(client):
    import schedulers as sched
    from app import app as flask_app
    from schedulers import init_schedulers

    if getattr(sched, "_scheduler", None) and sched._scheduler.running:
        sched._scheduler.shutdown(wait=False)
        sched._scheduler = None

    init_schedulers(flask_app)
    try:
        job = sched._scheduler.get_job("delete_unattached_files_daily")
        assert job is not None
        assert isinstance(job.trigger, CronTrigger)
        fields = {field.name: str(field) for field in job.trigger.fields}
        assert fields["hour"] == "3"
        assert fields["minute"] == "0"
    finally:
        sched._scheduler.shutdown(wait=False)
        sched._scheduler = None
