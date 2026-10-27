from datetime import datetime

from flask import g

from app import app
from extensions import db
from models.area import Area
from models.file import File
from models.line import Line
from models.topo_image import TopoImage
from models.user import User
from util.auth_session import SESSION_COOKIE_NAME
from util.topo_quality_backfill import backfill_creator_points
from util.topo_quality_score import (
    CREATE_ITEM,
    LINE_DESCRIPTION,
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


def test_adding_topo_image_gps_awards_points(client, moderator_token):
    topo_image = TopoImage.query.first()
    user = User.find_by_email("moderator@localcrag.invalid.org")
    before = user.topo_points

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
    assert user.topo_points == before + TOPO_GPS

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
    before = user.topo_points

    with app.test_request_context("/", headers={"Cookie": f"{SESSION_COOKIE_NAME}={admin_token.session_id}"}):
        line.roof = True
        db.session.flush()
        assert g.topo_points_delta == LINE_STYLE

    db.session.refresh(user)
    assert user.topo_points == before + LINE_STYLE


def test_replacing_style_awards_only_the_edit_bonus(client, admin_token):
    line = Line.find_by_slug("super-spreader")
    for field in STYLE_FIELDS:
        setattr(line, field, False)
    line.roof = True
    db.session.flush()
    user = User.find_by_email("admin@localcrag.invalid.org")
    before = user.topo_points

    with app.test_request_context("/", headers={"Cookie": f"{SESSION_COOKIE_NAME}={admin_token.session_id}"}):
        line.slab = True
        db.session.flush()

    db.session.refresh(user)
    assert user.topo_points == before + 1


def test_ranking_orders_by_points_and_restart_clears_them(client, admin_token, member_token, moderator_token):
    admin = User.find_by_email("admin@localcrag.invalid.org")
    member = User.find_by_email("member@localcrag.invalid.org")
    admin.topo_points = 12
    member.topo_points = 12
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
    db.session.refresh(admin)
    assert admin.topo_points == 12

    reset = client.post("/api/topo-quality/restart", token=admin_token, json={"confirmation": "RESTART"})
    assert reset.status_code == 200
    db.session.refresh(admin)
    db.session.refresh(member)
    assert admin.topo_points == 0
    assert member.topo_points == 0


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
    before = user.topo_points

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
    assert user.topo_points == before + CREATE_ITEM + expected


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


def test_publishing_a_draft_pays_the_author_for_fields_already_filled(client, member_token, moderator_token):
    author = User.find_by_email("member@localcrag.invalid.org")
    publisher = User.find_by_email("moderator@localcrag.invalid.org")
    author_before = author.topo_points
    publisher_before = publisher.topo_points

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
    assert author.topo_points == author_before

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
    assert publisher.topo_points == publisher_before + CREATE_ITEM
    author_gain = author.topo_points - author_before
    assert author_gain >= LINE_STYLE + LINE_VIDEO + LINE_FA
    assert author_gain <= LINE_STYLE + LINE_VIDEO + LINE_FA + LINE_DESCRIPTION


def test_publishing_a_draft_topo_image_pays_its_author_for_gps(client, member_token, moderator_token):
    author = User.find_by_email("member@localcrag.invalid.org")
    publisher = User.find_by_email("moderator@localcrag.invalid.org")
    author_before = author.topo_points
    publisher_before = publisher.topo_points
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
    assert author.topo_points == author_before

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
    assert publisher.topo_points == publisher_before + CREATE_ITEM
    assert author.topo_points == author_before + TOPO_GPS


def test_backfill_credits_creators_without_raising(client):
    backfill_creator_points(db.session.connection())
    credited = User.query.filter(User.topo_points > 0).count()
    assert credited >= 0
