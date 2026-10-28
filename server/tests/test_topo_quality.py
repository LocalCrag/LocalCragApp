import json
from datetime import datetime

from flask import g

from app import app
from extensions import db
from models.area import Area
from models.crag import Crag
from models.enums.line_type_enum import LineTypeEnum
from models.enums.notification_type_enum import NotificationTypeEnum
from models.enums.publication_status_enum import PublicationStatusEnum
from models.enums.starting_position_enum import StartingPositionEnum
from models.file import File
from models.instance_settings import InstanceSettings
from models.line import Line
from models.notification import Notification
from models.sector import Sector
from models.topo_image import TopoImage
from models.topo_point_event import TopoPointEvent
from models.user import User
from util.auth_session import SESSION_COOKIE_NAME
from util.topo_quality_backfill import backfill_creator_points
from util.topo_quality_score import (
    CREATE_ITEM,
    LINE_DESCRIPTION,
    LINE_DRAWN,
    LINE_FA,
    LINE_STYLE,
    LINE_VIDEO,
    SPOT_DESCRIPTION,
    SPOT_GPS,
    SPOT_IMAGE,
    SPOT_PARKING,
    STYLE_FIELDS,
    TOPO_GPS,
    LineRecord,
    SpotRecord,
    TopoRecord,
    creator_points,
    description_slots,
    score_scope,
    summarize,
    tier_for,
)


def _spot(**overrides):
    payload = dict(
        id="area-1",
        name="Area",
        slug="area",
        level="area",
        parent_id="sector-1",
        crag_slug="crag",
        sector_slug="sector",
        area_slug="area",
        order_index=0,
        created_by_id="user-1",
        published=True,
        has_gps=False,
        has_parking=False,
        has_description=False,
        has_image=False,
    )
    payload.update(overrides)
    return SpotRecord(**payload)


def _line(**overrides):
    payload = dict(
        id="line-1",
        name="Line",
        slug="line",
        area_id="area-1",
        crag_slug="crag",
        sector_slug="sector",
        area_slug="area",
        created_by_id="user-1",
        time_created=datetime(2024, 1, 1),
        published=True,
        drawn=True,
        styled=True,
        has_video=False,
        fa_complete=False,
        has_description=False,
    )
    payload.update(overrides)
    return LineRecord(**payload)


def test_required_checks_can_reach_100_without_bonus():
    spot = _spot(has_gps=True, has_parking=True, has_description=True, has_image=True)
    summary = score_scope([spot], [_line(has_description=True)], [], gym=False)
    assert summary["percent"] == 100
    assert summary["bonus"] == 0
    assert summary["tier"] == "platin"


def test_video_is_bonus_and_does_not_change_the_percent():
    spot = _spot(has_gps=True, has_parking=True, has_description=True, has_image=True)
    without = score_scope([spot], [_line(has_description=True)], [], gym=False)
    with_video = score_scope([spot], [_line(has_description=True, has_video=True)], [], gym=False)
    assert with_video["percent"] == without["percent"] == 100
    assert with_video["bonus"] == LINE_VIDEO


def test_gym_skips_gps_parking_and_line_descriptions():
    spot = _spot(has_description=True, has_image=True)
    outdoor = score_scope(
        [spot],
        [_line(has_description=True)],
        [
            TopoRecord(
                id="topo",
                name="",
                area_id="area-1",
                crag_slug="crag",
                sector_slug="sector",
                area_slug="area",
                created_by_id=None,
                published=True,
                has_gps=False,
            )
        ],
        gym=False,
    )
    gym = score_scope([spot], [_line(has_description=True)], [], gym=True)
    assert gym["max"] < outdoor["max"]
    assert description_slots(5, gym=True) == 0
    assert description_slots(5, gym=False) == 1


def test_tiers_follow_the_percent():
    assert tier_for(0) == "weak"
    assert tier_for(39) == "weak"
    assert tier_for(40) == "okay"
    assert tier_for(79) == "solid"
    assert tier_for(94) == "good"
    assert tier_for(95) == "platin"
    assert summarize(1, 2, 0)["percent"] == 50


def test_description_quota_is_one_fifth_rounded_up():
    assert description_slots(1, gym=False) == 1
    assert description_slots(4, gym=False) == 1
    assert description_slots(6, gym=False) == 2


def test_quality_tree_requires_a_member(client, member_token, user_token):
    allowed = client.get("/api/topo-quality", token=member_token)
    assert allowed.status_code == 200
    assert allowed.json["region"]["name"]
    assert allowed.json["region"]["tier"] in {"weak", "okay", "solid", "good", "platin"}
    assert "crags" in allowed.json["region"]

    denied = client.get("/api/topo-quality", token=user_token)
    assert denied.status_code == 401


def test_quality_detail_lists_checks(client, member_token):
    area = Area.find_by_slug("shark-attack")
    sector = area.sector
    crag = sector.crag
    rv = client.get(
        f"/api/topo-quality/crags/{crag.slug}/sectors/{sector.slug}/areas/{area.slug}",
        token=member_token,
    )
    assert rv.status_code == 200, rv.json
    keys = {check["key"] for check in rv.json["checks"]}
    assert "lineDrawn" in keys
    assert "lineStyle" in keys
    assert rv.json["name"] == area.name
    line_items = [item for check in rv.json["checks"] for item in check["items"] if item["kind"] == "line"]
    if line_items:
        assert line_items[0]["cragName"] == crag.name
        assert line_items[0]["sectorName"] == sector.name
        assert line_items[0]["areaName"] == area.name
        assert {item["areaSlug"] for item in line_items} == {area.slug}

    crag_detail = client.get(f"/api/topo-quality/crags/{crag.slug}", token=member_token)
    assert crag_detail.status_code == 200, crag_detail.text
    assert crag_detail.json["name"] == crag.name
    sector_detail = client.get(
        f"/api/topo-quality/crags/{crag.slug}/sectors/{sector.slug}",
        token=member_token,
    )
    assert sector_detail.status_code == 200, sector_detail.text
    assert sector_detail.json["name"] == sector.name


def test_adding_topo_image_gps_awards_points(client, moderator_token):
    topo_image = TopoImage.query.first()
    user = User.find_by_email("moderator@localcrag.invalid.org")
    before = _points(user)

    rv = client.put(
        f"/api/topo-images/{topo_image.id}",
        token=moderator_token,
        json={
            "image": str(topo_image.file_id),
            "mapMarkers": [
                {
                    "lat": 12.13,
                    "lng": 42.42,
                    "type": "TOPO_IMAGE",
                    "description": None,
                    "name": None,
                }
            ],
            "title": topo_image.title,
            "description": topo_image.description,
        },
    )
    assert rv.status_code == 200
    assert rv.headers.get("X-Topo-Points-Delta") == str(TOPO_GPS)
    db.session.refresh(user)
    assert _points(user) == before + TOPO_GPS

    marker_id = rv.json["mapMarkers"][0]["id"]
    # The test app context keeps g across requests. A real request starts clean.
    if hasattr(g, "topo_points_delta"):
        del g.topo_points_delta
    again = client.put(
        f"/api/topo-images/{topo_image.id}",
        token=moderator_token,
        json={
            "image": str(topo_image.file_id),
            "mapMarkers": [
                {
                    "id": marker_id,
                    "lat": 12.13,
                    "lng": 42.42,
                    "type": "TOPO_IMAGE",
                    "description": None,
                    "name": None,
                }
            ],
            "title": topo_image.title,
            "description": topo_image.description,
        },
    )
    assert again.status_code == 200
    assert again.headers.get("X-Topo-Points-Delta") is None

    moved = client.put(
        f"/api/topo-images/{topo_image.id}",
        token=moderator_token,
        json={
            "image": str(topo_image.file_id),
            "mapMarkers": [
                {
                    "id": marker_id,
                    "lat": 12.5,
                    "lng": 42.5,
                    "type": "TOPO_IMAGE",
                    "description": None,
                    "name": None,
                }
            ],
            "title": topo_image.title,
            "description": topo_image.description,
        },
    )
    assert moved.status_code == 200
    assert moved.headers.get("X-Topo-Points-Delta") == "1"


def test_adding_line_style_awards_points(client, admin_token):
    line = Line.find_by_slug("super-spreader")
    for field in STYLE_FIELDS:
        setattr(line, field, False)
    db.session.flush()
    user = User.find_by_email("admin@localcrag.invalid.org")
    before = _points(user)

    with app.test_request_context("/", headers={"Cookie": f"{SESSION_COOKIE_NAME}={admin_token.session_id}"}):
        line.roof = True
        db.session.flush()
        assert g.topo_points_delta == LINE_STYLE

    db.session.refresh(user)
    assert _points(user) == before + LINE_STYLE


def test_replacing_style_awards_only_the_edit_bonus(client, admin_token):
    line = Line.find_by_slug("super-spreader")
    for field in STYLE_FIELDS:
        setattr(line, field, False)
    line.roof = True
    db.session.flush()
    user = User.find_by_email("admin@localcrag.invalid.org")
    before = _points(user)

    with app.test_request_context("/", headers={"Cookie": f"{SESSION_COOKIE_NAME}={admin_token.session_id}"}):
        line.slab = True
        db.session.flush()

    db.session.refresh(user)
    assert _points(user) == before + 1


def test_ranking_orders_by_points_and_restart_clears_them(client, admin_token, member_token, moderator_token):
    admin = User.find_by_email("admin@localcrag.invalid.org")
    member = User.find_by_email("member@localcrag.invalid.org")
    _set_points(admin, 12)
    _set_points(member, 12)
    db.session.commit()

    denied = client.get("/api/topo-quality/ranking", token=member_token)
    assert denied.status_code == 401

    ranking = client.get("/api/topo-quality/ranking", token=moderator_token)
    assert ranking.status_code == 200
    assert [row["points"] for row in ranking.json] == [12]
    assert ranking.json[0]["rank"] == 1
    assert ranking.json[0]["user"]["id"] == str(admin.id)

    refused = client.post("/api/topo-quality/restart", token=member_token, json={"confirmation": "RESTART"})
    assert refused.status_code == 401

    wrong = client.post("/api/topo-quality/restart", token=admin_token, json={"confirmation": "no"})
    assert wrong.status_code == 400
    assert _points(admin) == 12

    db.session.add(TopoPointEvent(user_id=admin.id, points=4))
    db.session.commit()

    reset = client.post("/api/topo-quality/restart", token=admin_token, json={"confirmation": "RESTART"})
    assert reset.status_code == 200
    assert _points(admin) == 0
    assert _points(member) == 0
    assert TopoPointEvent.query.count() == 0


def _points(user) -> int:
    total = (
        db.session.query(db.func.coalesce(db.func.sum(TopoPointEvent.points), 0))
        .filter(TopoPointEvent.user_id == user.id)
        .scalar()
    )
    return int(total or 0)


def _set_points(user, points: int) -> None:
    TopoPointEvent.query.filter_by(user_id=user.id).delete()
    if points:
        db.session.add(TopoPointEvent(user_id=user.id, points=points, opening_balance=True))


def _clear_points_header():
    if hasattr(g, "topo_points_delta"):
        del g.topo_points_delta


def _line_payload(**overrides):
    payload = {
        "name": "Plain new line",
        "description": None,
        "videos": None,
        "color": None,
        "authorGradeValue": 0,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": None,
        "faYear": None,
        "faDate": None,
        "faName": None,
        "startingPosition": "FRENCH",
        "eliminate": False,
        "traverse": False,
        "highball": False,
        "morpho": False,
        "variant": False,
        "lowball": False,
        "noTopout": False,
        "badDropzone": False,
        "childFriendly": False,
        "roof": False,
        "slab": False,
        "vertical": False,
        "overhang": False,
        "athletic": False,
        "technical": False,
        "endurance": False,
        "cruxy": False,
        "dyno": False,
        "jugs": False,
        "sloper": False,
        "crimps": False,
        "pockets": False,
        "pinches": False,
        "crack": False,
        "dihedral": False,
        "compression": False,
        "arete": False,
        "mantle": False,
        "secret": False,
        "closureSchedules": [],
    }
    payload.update(overrides)
    return payload


def _crag_payload(**overrides):
    payload = {
        "name": "New crag",
        "description": None,
        "shortDescription": None,
        "rules": None,
        "rulesTitle": None,
        "portraitImage": None,
        "mapMarkers": [],
        "secret": False,
        "defaultBoulderScale": None,
        "defaultSportScale": None,
        "defaultTradScale": None,
        "blocweatherUrl": None,
        "closureSchedules": [],
    }
    payload.update(overrides)
    return payload


def _header_points(response) -> int:
    raw = response.headers.get("X-Topo-Points-Delta")
    return int(raw) if raw else 0


def test_creating_a_line_awards_points_for_its_initial_properties(client, moderator_token):
    _clear_points_header()
    plain = client.post("/api/areas/shark-attack/lines", token=moderator_token, json=_line_payload(name="Bare line"))
    assert plain.status_code == 201
    plain_points = _header_points(plain)
    assert plain_points == CREATE_ITEM

    _clear_points_header()
    rich = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_line_payload(
            name="Rich line",
            description="A described boulder",
            videos=[{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
            faYear=2016,
            faName="Dave Graham",
            roof=True,
        ),
    )
    assert rich.status_code == 201
    assert _header_points(rich) >= plain_points + LINE_STYLE + LINE_VIDEO + LINE_FA


def test_creating_a_crag_awards_points_for_its_initial_properties(client, moderator_token, any_file):
    user = User.find_by_email("moderator@localcrag.invalid.org")
    before = _points(user)

    _clear_points_header()
    plain = client.post("/api/crags", token=moderator_token, json=_crag_payload(name="Bare crag"))
    assert plain.status_code == 201
    assert _header_points(plain) == CREATE_ITEM

    _clear_points_header()
    rich = client.post(
        "/api/crags",
        token=moderator_token,
        json=_crag_payload(
            name="Rich crag",
            description="Where to climb",
            portraitImage=str(any_file.id),
            mapMarkers=[
                {"lat": 12.13, "lng": 42.42, "type": "CRAG", "name": None, "description": None},
                {"lat": 12.2, "lng": 42.5, "type": "PARKING", "name": None, "description": None},
            ],
        ),
    )
    assert rich.status_code == 201
    expected = CREATE_ITEM + SPOT_DESCRIPTION + SPOT_IMAGE + SPOT_GPS + SPOT_PARKING
    assert _header_points(rich) == expected
    db.session.refresh(user)
    assert _points(user) == before + CREATE_ITEM + expected


def test_creating_a_topo_image_with_gps_awards_points(client, moderator_token):
    plain_file, pinned_file = File.query.limit(2).all()
    _clear_points_header()
    plain = client.post(
        "/api/areas/shark-attack/topo-images",
        token=moderator_token,
        json={"image": str(plain_file.id), "mapMarkers": [], "title": "No pin", "description": None},
    )
    assert plain.status_code == 201
    assert _header_points(plain) == CREATE_ITEM

    _clear_points_header()
    pinned = client.post(
        "/api/areas/shark-attack/topo-images",
        token=moderator_token,
        json={
            "image": str(pinned_file.id),
            "mapMarkers": [{"lat": 12.13, "lng": 42.42, "type": "TOPO_IMAGE", "description": None, "name": None}],
            "title": "Pinned",
            "description": None,
        },
    )
    assert pinned.status_code == 201
    assert _header_points(pinned) == CREATE_ITEM + TOPO_GPS


def test_deleting_a_topo_image_with_gps_keeps_the_editors_points(client, moderator_token):
    user = User.find_by_email("moderator@localcrag.invalid.org")
    image = File.query.first()
    _clear_points_header()
    created = client.post(
        "/api/areas/shark-attack/topo-images",
        token=moderator_token,
        json={
            "image": str(image.id),
            "mapMarkers": [{"lat": 12.13, "lng": 42.42, "type": "TOPO_IMAGE", "description": None, "name": None}],
            "title": "Pinned then deleted",
            "description": None,
        },
    )
    assert created.status_code == 201, created.text
    db.session.refresh(user)
    before = _points(user)

    _clear_points_header()
    deleted = client.delete(f"/api/topo-images/{created.json['id']}", token=moderator_token)
    assert deleted.status_code == 204, deleted.text
    assert _header_points(deleted) == 0
    db.session.refresh(user)
    assert _points(user) == before


def test_publishing_a_draft_pays_the_author_for_fields_already_filled(client, member_token, moderator_token):
    author = User.find_by_email("member@localcrag.invalid.org")
    publisher = User.find_by_email("moderator@localcrag.invalid.org")
    author_before = _points(author)
    publisher_before = _points(publisher)

    _clear_points_header()
    created = client.post(
        "/api/areas/shark-attack/lines",
        token=member_token,
        json=_line_payload(
            name="Suggested rich line",
            description="A described boulder",
            videos=[{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
            faYear=2016,
            faName="Dave Graham",
            roof=True,
        ),
    )
    assert created.status_code == 201, created.text
    assert created.json["publicationStatus"] == "draft"
    assert _header_points(created) == 0
    db.session.refresh(author)
    assert _points(author) == author_before

    _clear_points_header()
    published = client.post(
        f"/api/lines/{created.json['slug']}/publish",
        token=moderator_token,
        json={"message": "Looks good"},
    )
    assert published.status_code == 200, published.text
    assert _header_points(published) == CREATE_ITEM
    db.session.refresh(author)
    db.session.refresh(publisher)
    assert _points(publisher) == publisher_before + CREATE_ITEM
    author_gain = _points(author) - author_before
    assert author_gain >= LINE_STYLE + LINE_VIDEO + LINE_FA
    assert author_gain <= LINE_STYLE + LINE_VIDEO + LINE_FA + LINE_DESCRIPTION


def test_publishing_a_draft_topo_image_pays_its_author_for_gps(client, member_token, moderator_token):
    author = User.find_by_email("member@localcrag.invalid.org")
    publisher = User.find_by_email("moderator@localcrag.invalid.org")
    author_before = _points(author)
    publisher_before = _points(publisher)
    image = File.query.first()

    _clear_points_header()
    created = client.post(
        "/api/areas/shark-attack/topo-images",
        token=member_token,
        json={
            "image": str(image.id),
            "mapMarkers": [{"lat": 12.13, "lng": 42.42, "type": "TOPO_IMAGE", "description": None, "name": None}],
            "title": "Suggested pin",
            "description": None,
        },
    )
    assert created.status_code == 201, created.text
    assert _header_points(created) == 0
    db.session.refresh(author)
    assert _points(author) == author_before

    _clear_points_header()
    published = client.post(
        f"/api/topo-images/{created.json['id']}/publish",
        token=moderator_token,
        json={"message": "Looks good"},
    )
    assert published.status_code == 200, published.text
    assert _header_points(published) == CREATE_ITEM
    db.session.refresh(author)
    db.session.refresh(publisher)
    assert _points(publisher) == publisher_before + CREATE_ITEM
    assert _points(author) == author_before + TOPO_GPS


def test_backfill_credits_creators_without_raising(client):
    backfill_creator_points(db.session.connection())
    credited = (
        db.session.query(TopoPointEvent.user_id)
        .group_by(TopoPointEvent.user_id)
        .having(db.func.sum(TopoPointEvent.points) > 0)
        .count()
    )
    assert credited >= 0


def _stored_line(area, name, created_by_id, when, description=None):
    line = Line()
    line.name = name
    line.description = description
    line.type = LineTypeEnum.BOULDER
    line.area_id = area.id
    line.grade_scale = "FB"
    line.author_grade_value = 0
    line.user_grade_value = 0
    line.starting_position = StartingPositionEnum.FRENCH
    line.created_by_id = created_by_id
    line.time_created = when
    line.publication_status = PublicationStatusEnum.PUBLISHED
    db.session.add(line)
    return line


def _spot_chain(name, crag_status):
    crag = Crag()
    crag.name = name
    crag.publication_status = crag_status
    db.session.add(crag)
    db.session.flush()
    sector = Sector()
    sector.name = f"{name} sector"
    sector.crag_id = crag.id
    sector.publication_status = PublicationStatusEnum.PUBLISHED
    db.session.add(sector)
    db.session.flush()
    area = Area()
    area.name = f"{name} area"
    area.sector_id = sector.id
    area.publication_status = PublicationStatusEnum.PUBLISHED
    db.session.add(area)
    db.session.flush()
    return crag, sector, area


def test_opening_a_description_slot_pays_the_line_author(client, moderator_token):
    member = User.find_by_email("member@localcrag.invalid.org")
    moderator = User.find_by_email("moderator@localcrag.invalid.org")
    _crag, _sector, area = _spot_chain("Quota holder", PublicationStatusEnum.PUBLISHED)
    for index in range(3):
        _stored_line(
            area,
            f"Quota described {index}",
            member.id,
            datetime(2020, 1, index + 1),
            description="<p>Already written.</p>",
        )
    for index in range(7):
        _stored_line(area, f"Quota bare {index}", member.id, datetime(2020, 2, index + 1))
    db.session.commit()
    db.session.refresh(member)
    db.session.refresh(moderator)
    member_before = _points(member)
    moderator_before = _points(moderator)

    _clear_points_header()
    created = client.post(
        f"/api/areas/{area.slug}/lines",
        token=moderator_token,
        json=_line_payload(name="Quota opener"),
    )
    assert created.status_code == 201, created.text
    assert _header_points(created) == CREATE_ITEM
    db.session.refresh(member)
    db.session.refresh(moderator)
    assert _points(member) == member_before + LINE_DESCRIPTION
    assert _points(moderator) == moderator_before + CREATE_ITEM


def test_hidden_ancestor_earns_no_points_and_stays_out_of_backfill(client, moderator_token, member_token):
    member = User.find_by_email("member@localcrag.invalid.org")
    moderator = User.find_by_email("moderator@localcrag.invalid.org")
    backfill_creator_points(db.session.connection())
    db.session.commit()
    db.session.refresh(member)
    before_backfill = _points(member)

    crag, sector, area = _spot_chain("Hidden parent", PublicationStatusEnum.DRAFT)
    _stored_line(
        area,
        "Hidden described line",
        member.id,
        datetime(2020, 3, 1),
        description="<p>Not on the report.</p>",
    )
    db.session.commit()
    backfill_creator_points(db.session.connection())
    db.session.commit()
    db.session.refresh(member)
    assert _points(member) == before_backfill

    hidden = client.get(
        f"/api/topo-quality/crags/{crag.slug}/sectors/{sector.slug}/areas/{area.slug}",
        token=member_token,
    )
    assert hidden.status_code == 404

    _clear_points_header()
    db.session.refresh(moderator)
    before = _points(moderator)
    created = client.post(
        f"/api/areas/{area.slug}/lines",
        token=moderator_token,
        json=_line_payload(
            name="Hidden new line",
            videos=[{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        ),
    )
    assert created.status_code == 201, created.text
    assert _header_points(created) == 0
    db.session.refresh(moderator)
    assert _points(moderator) == before


def test_project_style_stays_out_of_the_percent_and_still_pays():
    spot = _spot(has_gps=True, has_parking=True, has_description=True, has_image=True)
    bare = score_scope(
        [spot],
        [_line(is_project=True, styled=False, has_description=True, has_video=True, fa_complete=True)],
        [],
        gym=False,
    )
    styled = score_scope(
        [spot],
        [_line(is_project=True, styled=True, has_description=True, has_video=True, fa_complete=True)],
        [],
        gym=False,
    )
    assert bare["percent"] == 100
    assert styled["percent"] == bare["percent"]
    assert styled["earned"] == bare["earned"]
    assert styled["bonus"] == 0
    points = creator_points(
        [],
        [_line(is_project=True, styled=True, drawn=True, has_video=True, fa_complete=True)],
        [],
        gym=False,
    )
    assert points["user-1"] == CREATE_ITEM + LINE_DRAWN + LINE_STYLE


def test_parent_parking_covers_children_without_dropping_the_points():
    parent = _spot(
        id="crag",
        level="crag",
        parent_id=None,
        slug="crag",
        sector_slug=None,
        area_slug=None,
        has_parking=True,
        has_gps=True,
        has_description=True,
        has_image=True,
        created_by_id="parent",
    )
    child = _spot(
        id="area",
        parent_id="crag",
        has_parking=False,
        has_gps=True,
        has_description=True,
        has_image=True,
        created_by_id="child",
    )
    covered = score_scope([parent, child], [], [], gym=False)
    assert covered["percent"] == 100
    child_set = _spot(
        id="area",
        parent_id="crag",
        has_parking=True,
        has_gps=True,
        has_description=True,
        has_image=True,
        created_by_id="child",
    )
    still = score_scope([parent, child_set], [], [], gym=False)
    assert still["percent"] == 100
    assert still["earned"] == covered["earned"]
    without = creator_points([parent, child], [], [], gym=False)
    with_parking = creator_points([parent, child_set], [], [], gym=False)
    assert with_parking["child"] == without["child"] + SPOT_PARKING

    open_parent = _spot(
        id="crag",
        level="crag",
        parent_id=None,
        slug="crag",
        has_parking=False,
        has_gps=True,
        has_description=True,
        has_image=True,
    )
    missing = score_scope([open_parent, child], [], [], gym=False)
    assert missing["percent"] < 100


def test_project_video_awards_nothing_and_style_still_pays(client, admin_token):
    line = Line.find_by_slug("super-spreader")
    line.author_grade_value = -1
    line.user_grade_value = -1
    line.videos = None
    line.fa_name = None
    line.fa_date = None
    line.fa_year = None
    for field in STYLE_FIELDS:
        setattr(line, field, False)
    db.session.flush()
    user = User.find_by_email("admin@localcrag.invalid.org")
    before = _points(user)

    with app.test_request_context("/", headers={"Cookie": f"{SESSION_COOKIE_NAME}={admin_token.session_id}"}):
        line.videos = [{"url": "https://example.com/project-video"}]
        line.fa_name = "Someone"
        line.fa_year = 2020
        db.session.flush()
        assert getattr(g, "topo_points_delta", 0) == 0

    db.session.refresh(user)
    assert _points(user) == before

    with app.test_request_context("/", headers={"Cookie": f"{SESSION_COOKIE_NAME}={admin_token.session_id}"}):
        line.roof = True
        db.session.flush()
        assert g.topo_points_delta == LINE_STYLE

    db.session.refresh(user)
    assert _points(user) == before + LINE_STYLE


def test_weekly_summary_and_trends(client, moderator_token, member_token):
    denied = client.get("/api/topo-quality/history", token=member_token)
    assert denied.status_code == 401
    denied_points = client.get("/api/topo-quality/points-history", token=member_token)
    assert denied_points.status_code == 401

    history = client.get("/api/topo-quality/history", token=moderator_token)
    assert history.status_code == 200
    assert any(scope["key"] == "region" for scope in history.json["scopes"])
    assert history.json["weeks"]
    assert isinstance(history.json["series"]["region"][-1], int)

    admin = User.find_by_email("admin@localcrag.invalid.org")
    settings = InstanceSettings.return_it()
    settings.moderator_game_enabled = False
    settings.timezone = "UTC"
    db.session.add(TopoPointEvent(user_id=admin.id, points=9, time_created=datetime(2026, 10, 20, 12, 0)))
    db.session.add(TopoPointEvent(user_id=admin.id, points=50, opening_balance=True))
    db.session.commit()

    from util.moderator_task_notifications import should_show_notification_to_user
    from util.notifications import should_send_notification_mail
    from util.topo_quality_history import send_previous_week_summary

    week = datetime(2026, 10, 26).date()
    assert send_previous_week_summary(today=week) == 0
    assert Notification.query.filter_by(type=NotificationTypeEnum.TOPO_POINTS_WEEKLY).count() == 0
    assert should_show_notification_to_user(admin, NotificationTypeEnum.TOPO_POINTS_WEEKLY) is False
    assert should_send_notification_mail(admin.account_settings, NotificationTypeEnum.TOPO_POINTS_WEEKLY) is False

    settings.moderator_game_enabled = True
    db.session.commit()
    created = send_previous_week_summary(today=week)
    assert created >= 1
    note = Notification.query.filter_by(type=NotificationTypeEnum.TOPO_POINTS_WEEKLY, user_id=admin.id).one()
    payload = json.loads(note.message)
    assert payload["week"] == "2026-10-19"
    assert payload["rows"][0]["points"] == 9
    assert send_previous_week_summary(today=datetime(2026, 10, 26).date()) == 0

    points = client.get("/api/topo-quality/points-history", token=moderator_token)
    assert points.status_code == 200
    series = next(row for row in points.json["series"] if row["user"]["id"] == str(admin.id))
    assert sum(series["points"]) == 9
    ranking = client.get("/api/topo-quality/ranking", token=moderator_token)
    assert ranking.status_code == 200
    ranked = next(row for row in ranking.json if row["user"]["id"] == str(admin.id))
    assert ranked["points"] == 59

    from util.notification_digest_builder import build_digest_items

    items = build_digest_items([note], None)
    assert "9" in items[0]["html"]
    assert should_show_notification_to_user(admin, NotificationTypeEnum.TOPO_POINTS_WEEKLY) is True
    assert should_send_notification_mail(admin.account_settings, NotificationTypeEnum.TOPO_POINTS_WEEKLY) is True
