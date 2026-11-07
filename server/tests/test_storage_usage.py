from flask import current_app

from extensions import db
from models.area import Area
from models.crag import Crag
from models.file import File
from models.gallery_image import GalleryImage
from models.line import Line
from models.region import Region
from models.topo_image import TopoImage
from models.video import Video
from uploader.file_storage import stored_bytes_for_file
from util.storage_usage import capacity_bytes_from_status, parse_disk_space


def _stored_file(name: str, size: int) -> File:
    stored = File()
    stored.original_filename = name
    stored.filename = name
    stored.file_size = size
    db.session.add(stored)
    db.session.flush()
    return stored


def test_stored_bytes_include_marked_thumbnails():
    sizes = {"photo.jpg": 100, "photo_xs.jpg": 10, "photo_m.jpg": 40, "photo_xl.jpg": 80}
    total = stored_bytes_for_file(
        sizes,
        "photo.jpg",
        {"thumbnail_xs": True, "thumbnail_s": False, "thumbnail_m": True, "thumbnail_l": None, "thumbnail_xl": True},
    )
    assert total == 230


def test_parse_disk_space():
    assert parse_disk_space("2048") == 2048
    assert parse_disk_space("2Ki") == 2048
    assert parse_disk_space("1.5 GiB") == int(1.5 * 1024**3)
    assert parse_disk_space("100GB") == 100 * 1000**3
    assert parse_disk_space("nope") is None
    assert parse_disk_space("0Gi") is None


def test_capacity_bytes_from_seaweed_status():
    assert capacity_bytes_from_status({"DiskStatuses": [{"dir": "/data", "all": 10}, {"all": 5}]}) == 15
    assert capacity_bytes_from_status({}) is None
    assert capacity_bytes_from_status({"DiskStatuses": [{"free": 1}]}) is None


def test_storage_usage_requires_admin(client, member_token):
    forbidden = client.get("/api/instance-settings/storage", token=member_token)
    assert forbidden.status_code == 401
    anonymous = client.get("/api/instance-settings/storage")
    assert anonymous.status_code == 401


def test_storage_usage_groups_files_once(client, admin_token, monkeypatch):
    video = _stored_file("climb.mp4", 100)
    gallery = _stored_file("gallery.jpg", 200)
    header = _stored_file("header.jpg", 300)
    topo_file = _stored_file("topo.jpg", 50)
    _stored_file("avatar.png", 400)

    line = Line.query.first()
    line.videos = [
        Video.from_dict(
            {"url": "https://example.com/climb.mp4", "title": "Climb", "source": "upload", "fileId": str(video.id)},
            0,
        )
    ]
    db.session.add(GalleryImage(file_id=video.id))
    db.session.add(GalleryImage(file_id=gallery.id))
    topo_image = TopoImage()
    topo_image.area_id = Area.query.first().id
    topo_image.file_id = topo_file.id
    topo_image.order_index = 99
    db.session.add(topo_image)
    Region.query.first().image_id = header.id
    Crag.query.first().portrait_image_id = header.id
    db.session.commit()

    monkeypatch.setattr("resources.instance_settings_resources.storage_capacity_bytes", lambda: 5000)
    response = client.get("/api/instance-settings/storage", token=admin_token)

    assert response.status_code == 200
    assert response.json == {
        "videos": 100,
        "galleryImages": 200,
        "topoImages": 350,
        "other": 400,
        "capacity": 5000,
    }


def test_storage_usage_omits_capacity_without_seaweed(client, admin_token):
    response = client.get("/api/instance-settings/storage", token=admin_token)
    assert response.status_code == 200
    assert response.json["capacity"] is None


def test_storage_usage_uses_configured_disk_space(client, admin_token, monkeypatch):
    monkeypatch.setitem(current_app.config, "STORAGE_CAPACITY_URL", None)
    monkeypatch.setitem(current_app.config, "STORAGE_DISK_SPACE", "2Ki")

    response = client.get("/api/instance-settings/storage", token=admin_token)

    assert response.status_code == 200
    assert response.json["capacity"] == 2048


def test_configured_disk_space_does_not_replace_seaweed(client, admin_token, monkeypatch):
    monkeypatch.setitem(current_app.config, "STORAGE_CAPACITY_URL", "http://seaweed.invalid/status")
    monkeypatch.setitem(current_app.config, "STORAGE_DISK_SPACE", "2Ki")
    monkeypatch.setattr("util.storage_usage.urllib.request.urlopen", _raise_oserror)

    response = client.get("/api/instance-settings/storage", token=admin_token)

    assert response.status_code == 200
    assert response.json["capacity"] is None


def _raise_oserror(*_args, **_kwargs):
    raise OSError("storage status unavailable")
