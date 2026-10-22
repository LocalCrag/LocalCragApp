import json

from models.area import Area
from models.crag import Crag
from models.enums.archive_type_enum import ArchiveTypeEnum
from models.enums.notification_type_enum import NotificationTypeEnum
from models.enums.publication_status_enum import PublicationStatusEnum
from models.file import File
from models.line import Line
from models.notification import Notification
from models.sector import Sector
from models.topo_image import TopoImage
from models.user import User
from tests.test_line_resources import _boulder_line_payload


def test_archive_line(client, moderator_token, gym_mode):
    archive_data = {
        "type": ArchiveTypeEnum.LINE,
        "slug": "the-vessel",
        "value": True,
    }

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    line = Line.find_by_slug("the-vessel")
    assert line.publication_status == PublicationStatusEnum.ARCHIVED

    archive_data["value"] = False

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    line = Line.find_by_slug("the-vessel")
    assert line.publication_status == PublicationStatusEnum.PUBLISHED


def test_archive_topo_image(client, moderator_token, gym_mode):
    area_id = Area.get_id_by_slug("shark-attack")
    topo_image = TopoImage.query.filter_by(area_id=area_id, order_index=0).first()

    archive_data = {
        "type": ArchiveTypeEnum.TOPO_IMAGE,
        "slug": str(topo_image.id),
        "value": True,
        "cascade": True,
    }

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    topo_image = TopoImage.query.filter_by(area_id=area_id, order_index=0).first()
    assert topo_image.publication_status == PublicationStatusEnum.ARCHIVED

    # Cascade should archive all lines linked to this topo image
    stairs = Line.find_by_slug("the-vessel")
    super_spreader = Line.find_by_slug("super-spreader")
    assert stairs.publication_status == PublicationStatusEnum.ARCHIVED
    assert super_spreader.publication_status == PublicationStatusEnum.ARCHIVED

    # Topo Image should not be included in default list
    rv = client.get("/api/areas/shark-attack/topo-images")
    assert rv.status_code == 200
    res = rv.json
    assert str(topo_image.id) not in [r["id"] for r in res]

    # Unarchive with cascade=True should revert the lines' archived flags
    archive_data["value"] = False

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    topo_image = TopoImage.query.filter_by(area_id=area_id, order_index=0).first()
    assert topo_image.publication_status == PublicationStatusEnum.PUBLISHED

    stairs = Line.find_by_slug("the-vessel")
    super_spreader = Line.find_by_slug("super-spreader")
    assert stairs.publication_status == PublicationStatusEnum.PUBLISHED
    assert super_spreader.publication_status == PublicationStatusEnum.PUBLISHED


def test_archive_topo_image_without_cascade(client, moderator_token, gym_mode):
    """
    Archiving a topo image with cascade=False should not change any lines' archived flags.
    """
    area_id = Area.get_id_by_slug("shark-attack")
    topo_image = TopoImage.query.filter_by(area_id=area_id, order_index=0).first()

    # Ensure initial state is unarchived for involved lines
    stairs = Line.find_by_slug("the-vessel")
    super_spreader = Line.find_by_slug("super-spreader")
    assert stairs.publication_status == PublicationStatusEnum.PUBLISHED
    assert super_spreader.publication_status == PublicationStatusEnum.PUBLISHED

    archive_data = {
        "type": ArchiveTypeEnum.TOPO_IMAGE,
        "slug": str(topo_image.id),
        "value": True,
        "cascade": False,
    }

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    # Topo image archived, but lines unchanged
    topo_image = TopoImage.query.filter_by(area_id=area_id, order_index=0).first()
    assert topo_image.publication_status == PublicationStatusEnum.ARCHIVED

    stairs = Line.find_by_slug("the-vessel")
    super_spreader = Line.find_by_slug("super-spreader")
    assert stairs.publication_status == PublicationStatusEnum.PUBLISHED
    assert super_spreader.publication_status == PublicationStatusEnum.PUBLISHED

    # Unarchive without cascade - lines still unchanged
    archive_data["value"] = False

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    topo_image = TopoImage.query.filter_by(area_id=area_id, order_index=0).first()
    assert topo_image.publication_status == PublicationStatusEnum.PUBLISHED

    stairs = Line.find_by_slug("the-vessel")
    super_spreader = Line.find_by_slug("super-spreader")
    assert stairs.publication_status == PublicationStatusEnum.PUBLISHED
    assert super_spreader.publication_status == PublicationStatusEnum.PUBLISHED


def test_archive_second_topo_image_affects_only_associated_lines(client, moderator_token, gym_mode):
    """
    Archiving the second topo image (order_index=1) should only affect lines that have a path on it.
    In the test data, only "super-spreader" has a LinePath on order_index=1, while "the-vessel" does not.
    """
    area_id = Area.get_id_by_slug("shark-attack")
    topo_image = TopoImage.query.filter_by(area_id=area_id, order_index=1).first()

    # Ensure initial state
    stairs = Line.find_by_slug("the-vessel")
    super_spreader = Line.find_by_slug("super-spreader")
    assert stairs.publication_status == PublicationStatusEnum.PUBLISHED
    assert super_spreader.publication_status == PublicationStatusEnum.PUBLISHED

    archive_data = {
        "type": ArchiveTypeEnum.TOPO_IMAGE,
        "slug": str(topo_image.id),
        "value": True,
        "cascade": True,
    }

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    # Only super-spreader should be archived, the-vessel untouched
    stairs = Line.find_by_slug("the-vessel")
    super_spreader = Line.find_by_slug("super-spreader")
    assert stairs.publication_status == PublicationStatusEnum.PUBLISHED
    assert super_spreader.publication_status == PublicationStatusEnum.ARCHIVED

    # Revert
    archive_data["value"] = False
    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    stairs = Line.find_by_slug("the-vessel")
    super_spreader = Line.find_by_slug("super-spreader")
    assert stairs.publication_status == PublicationStatusEnum.PUBLISHED
    assert super_spreader.publication_status == PublicationStatusEnum.PUBLISHED


def test_archive_area(client, moderator_token, gym_mode):
    area_id = Area.get_id_by_slug("shark-attack")

    archive_data = {
        "type": ArchiveTypeEnum.AREA,
        "slug": "shark-attack",
        "value": True,
    }

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    assert Line.query.filter_by(area_id=area_id, publication_status=PublicationStatusEnum.PUBLISHED).count() == 0
    assert Line.query.filter_by(area_id=area_id, publication_status=PublicationStatusEnum.ARCHIVED).count() > 0
    assert Area.find_by_slug("shark-attack").publication_status == PublicationStatusEnum.ARCHIVED

    assert TopoImage.query.filter_by(area_id=area_id, publication_status=PublicationStatusEnum.PUBLISHED).count() == 0
    assert TopoImage.query.filter_by(area_id=area_id, publication_status=PublicationStatusEnum.ARCHIVED).count() > 0

    archive_data["value"] = False

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204
    assert Area.find_by_slug("shark-attack").publication_status == PublicationStatusEnum.PUBLISHED
    assert Line.query.filter_by(area_id=area_id, publication_status=PublicationStatusEnum.ARCHIVED).count() == 0
    assert Line.query.filter_by(area_id=area_id, publication_status=PublicationStatusEnum.PUBLISHED).count() > 0


def test_archive_sector(client, moderator_token, gym_mode):
    archive_data = {
        "type": ArchiveTypeEnum.SECTOR,
        "slug": "pampelmousse",
        "value": True,
    }

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    assert (
        Line.query.filter_by(sector_slug="pampelmousse", publication_status=PublicationStatusEnum.PUBLISHED).count()
        == 0
    )
    assert (
        Line.query.filter_by(sector_slug="pampelmousse", publication_status=PublicationStatusEnum.ARCHIVED).count() > 0
    )
    assert Sector.find_by_slug("pampelmousse").publication_status == PublicationStatusEnum.ARCHIVED

    assert (
        TopoImage.query.join(Area)
        .filter(Area.sector_slug == "pampelmousse", TopoImage.publication_status == PublicationStatusEnum.PUBLISHED)
        .count()
        == 0
    )
    assert (
        TopoImage.query.join(Area)
        .filter(Area.sector_slug == "pampelmousse", TopoImage.publication_status == PublicationStatusEnum.ARCHIVED)
        .count()
        > 0
    )

    archive_data["value"] = False

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204
    assert Sector.find_by_slug("pampelmousse").publication_status == PublicationStatusEnum.PUBLISHED


def test_archive_crag(client, moderator_token, gym_mode):
    archive_data = {
        "type": ArchiveTypeEnum.CRAG,
        "slug": "brione",
        "value": True,
    }

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    assert Line.query.filter_by(crag_slug="brione", publication_status=PublicationStatusEnum.PUBLISHED).count() == 0
    assert Line.query.filter_by(crag_slug="brione", publication_status=PublicationStatusEnum.ARCHIVED).count() > 0
    assert Crag.find_by_slug("brione").publication_status == PublicationStatusEnum.ARCHIVED

    assert (
        TopoImage.query.join(Area)
        .join(Sector)
        .filter(Sector.crag_slug == "brione", TopoImage.publication_status == PublicationStatusEnum.PUBLISHED)
        .count()
        == 0
    )
    assert (
        TopoImage.query.join(Area)
        .join(Sector)
        .filter(Sector.crag_slug == "brione", TopoImage.publication_status == PublicationStatusEnum.ARCHIVED)
        .count()
        > 0
    )

    archive_data["value"] = False

    rv = client.put("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204
    assert Crag.find_by_slug("brione").publication_status == PublicationStatusEnum.PUBLISHED


def _rejection_messages(author_id):
    notes = Notification.query.filter_by(user_id=author_id, type=NotificationTypeEnum.SUGGESTION_REJECTED).all()
    return [json.loads(note.message) for note in notes]


def _archived_rejection(name):
    return {"key": "suggestionReview.dialog.rejectedBecauseArchived", "name": name}


def test_archiving_area_rejects_drafts(client, member_token, moderator_token, gym_mode):
    created = client.post(
        "/api/areas/shark-attack/lines",
        token=member_token,
        json=_boulder_line_payload("Draft In Area", 10),
    )
    assert created.status_code == 201, created.text
    file = File.query.first()
    image = client.post(
        "/api/areas/shark-attack/topo-images",
        token=member_token,
        json={"image": str(file.id), "title": "Draft In Area", "description": None, "mapMarkers": []},
    )
    assert image.status_code == 201, image.text

    area = Area.find_by_slug("shark-attack")
    rv = client.put(
        "/api/archive",
        token=moderator_token,
        json={"type": ArchiveTypeEnum.AREA, "slug": "shark-attack", "value": True},
    )
    assert rv.status_code == 204, rv.text

    line = Line.find_by_slug(created.json["slug"])
    assert line.publication_status == PublicationStatusEnum.REJECTED
    topo = TopoImage.query.filter_by(id=image.json["id"]).first()
    assert topo.publication_status == PublicationStatusEnum.REJECTED
    published = Line.find_by_slug("the-vessel")
    assert published.publication_status == PublicationStatusEnum.ARCHIVED
    assert area.publication_status == PublicationStatusEnum.ARCHIVED

    author = User.find_by_email("member@localcrag.invalid.org")
    assert _rejection_messages(author.id).count(_archived_rejection(area.name)) == 2
    hidden = client.get(f"/api/lines/{line.slug}", token=moderator_token)
    assert hidden.status_code == 404


def test_archiving_sector_rejects_drafts_with_the_sector_name(client, member_token, moderator_token, gym_mode):
    created = client.post(
        "/api/areas/shark-attack/lines",
        token=member_token,
        json=_boulder_line_payload("Draft In Sector", 10),
    )
    assert created.status_code == 201, created.text
    sector = Sector.find_by_slug("pampelmousse")
    rv = client.put(
        "/api/archive",
        token=moderator_token,
        json={"type": ArchiveTypeEnum.SECTOR, "slug": "pampelmousse", "value": True},
    )
    assert rv.status_code == 204, rv.text
    line = Line.find_by_slug(created.json["slug"])
    assert line.publication_status == PublicationStatusEnum.REJECTED
    author = User.find_by_email("member@localcrag.invalid.org")
    assert _archived_rejection(sector.name) in _rejection_messages(author.id)


def test_archiving_topo_image_with_lines_rejects_drafts(client, member_token, moderator_token, gym_mode):
    created = client.post(
        "/api/areas/shark-attack/lines",
        token=member_token,
        json=_boulder_line_payload("Draft On Image", 10),
    )
    assert created.status_code == 201, created.text
    line = Line.find_by_slug(created.json["slug"])
    topo_image = TopoImage.query.filter_by(area_id=line.area_id, order_index=0).first()
    drawn = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=member_token,
        json={"linePaths": [{"line": str(line.id), "path": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]}]},
    )
    assert drawn.status_code == 200, drawn.text

    rv = client.put(
        "/api/archive",
        token=moderator_token,
        json={
            "type": ArchiveTypeEnum.TOPO_IMAGE,
            "slug": str(topo_image.id),
            "value": True,
            "cascade": True,
        },
    )
    assert rv.status_code == 204, rv.text
    line = Line.find_by_slug(created.json["slug"])
    assert line.publication_status == PublicationStatusEnum.REJECTED
    assert Line.find_by_slug("the-vessel").publication_status == PublicationStatusEnum.ARCHIVED
    reason = (topo_image.title or "").strip()
    author = User.find_by_email("member@localcrag.invalid.org")
    expected = (
        _archived_rejection(reason) if reason else {"key": "suggestionReview.dialog.rejectedBecauseTopoImageArchived"}
    )
    assert expected in _rejection_messages(author.id)

    restore = client.put(
        "/api/archive",
        token=moderator_token,
        json={
            "type": ArchiveTypeEnum.TOPO_IMAGE,
            "slug": str(topo_image.id),
            "value": False,
            "cascade": True,
        },
    )
    assert restore.status_code == 204, restore.text
    line = Line.find_by_slug(created.json["slug"])
    assert line.publication_status == PublicationStatusEnum.REJECTED


def test_cannot_archive_a_draft_line(client, member_token, moderator_token, gym_mode):
    created = client.post(
        "/api/areas/shark-attack/lines",
        token=member_token,
        json=_boulder_line_payload("Do Not Archive Draft", 10),
    )
    assert created.status_code == 201, created.text
    rv = client.put(
        "/api/archive",
        token=moderator_token,
        json={"type": ArchiveTypeEnum.LINE, "slug": created.json["slug"], "value": True},
    )
    assert rv.status_code == 400
    line = Line.find_by_slug(created.json["slug"])
    assert line.publication_status == PublicationStatusEnum.DRAFT
