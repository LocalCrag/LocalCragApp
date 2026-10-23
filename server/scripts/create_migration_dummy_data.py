"""Create a production-sized dataset so migration checks run against realistic rows.

The migration workflow runs this on the pull request base revision, after that
revision's migrations, and then checks out the pull request and migrates again.
`flask db upgrade` already inserts a superadmin, instance settings, grade scales,
menu items, release notes, and an empty region. This script fills the remaining
tables on top of that.

When a new database entity is added, seed it here too. Commentable entities need
a comment on every row.

Run from server/src:

    PYTHONPATH=. LOCALCRAG_CONFIG=config/test-ci.cfg pipenv run python ../scripts/create_migration_dummy_data.py
"""

import datetime
import logging
import time

from sqlalchemy import func

from app import app
from extensions import db
from migrations.util_scripts.add_scales import add_scales
from models.account_settings import AccountSettings
from models.admin_message import AdminMessage
from models.app_alert import AppAlert
from models.app_alert_dismissal import AppAlertDismissal
from models.area import Area
from models.ascent import Ascent
from models.closure_schedule import ClosureSchedule
from models.comment import Comment
from models.crag import Crag
from models.enums.app_alert_severity_enum import AppAlertSeverityEnum
from models.enums.closure_schedule_type_enum import ClosureScheduleTypeEnum
from models.enums.color_scheme_enum import ColorSchemeEnum
from models.enums.drying_enum import DryingEnum
from models.enums.history_item_type_enum import HistoryItemTypeEnum
from models.enums.line_type_enum import LineTypeEnum
from models.enums.map_marker_type_enum import MapMarkerType
from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.enums.notification_digest_frequency_enum import (
    NotificationDigestFrequencyEnum,
)
from models.enums.notification_type_enum import NotificationTypeEnum
from models.enums.permission_effect_enum import PermissionEffectEnum
from models.enums.publication_status_enum import PublicationStatusEnum
from models.enums.release_note_item_type_enum import ReleaseNoteItemTypeEnum
from models.enums.rock_explorer_access_issue_enum import RockExplorerAccessIssueEnum
from models.enums.rock_explorer_feature_status_enum import RockExplorerFeatureStatusEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum
from models.enums.starting_position_enum import StartingPositionEnum
from models.enums.todo_priority_enum import TodoPriorityEnum
from models.file import File
from models.file_link import FileLink
from models.gallery_image import GalleryImage
from models.history_item import HistoryItem
from models.instance_settings import InstanceSettings
from models.line import Line
from models.line_path import LinePath
from models.map_marker import MapMarker
from models.menu_item import MenuItem
from models.menu_page import MenuPage
from models.moderator_task import ModeratorTask
from models.notification import Notification
from models.permission import SUGGESTION_CREATE, Permission
from models.post import Post
from models.ranking import Ranking
from models.reaction import Reaction
from models.recent_search import RecentSearch
from models.region import Region
from models.release_note_bundle import ReleaseNoteBundle
from models.release_note_item import ReleaseNoteItem
from models.rock_explorer_feature import RockExplorerFeature
from models.rules_read_status import RulesReadStatus
from models.secret_topo_entity import (
    SecretTopoEntity,
    ensure_secret_listeners_registered,
)
from models.sector import Sector
from models.session import Session as AuthSession
from models.tabu_area import TabuArea
from models.tag import Tag
from models.todo import Todo
from models.topo_image import TopoImage
from models.user import User

logger = logging.getLogger(__name__)

USER_COUNT = 200
TARGET_LINE_COUNT = 3000
ASCENTS_PER_USER = 50
POST_COUNT = 20
GALLERY_IMAGE_COUNT = 100
ROCK_EXPLORER_COUNT = 12
MENU_PAGE_TITLES = (
    "Approach",
    "Ethics",
    "Partners",
    "Grade Info",
    "First Aid",
    "Wildlife",
    "Parking",
    "Conditions",
)
# name, sectors, areas per sector, lines per area, topo images per area.
# Line counts already land on 3000; the last area absorbs a remainder of 0–3.
CRAG_BLUEPRINTS = (
    ("Brione", 2, 2, 18, 1),
    ("Chironico", 3, 2, 16, 2),
    ("Magic Wood", 4, 3, 12, 2),
    ("Cresciano", 5, 3, 18, 3),
    ("Fontainebleau", 6, 4, 20, 2),
    ("Rocklands", 3, 4, 22, 4),
    ("Bishop", 8, 3, 15, 1),
    ("Joes Valley", 4, 5, 17, 3),
    ("Albarracin", 2, 3, 22, 2),
    ("Grampians", 7, 4, 30, 5),
)
SECTOR_LABELS = ("Cave", "Forest", "River", "Ridge", "Upper", "Lower", "North", "West")
AREA_LABELS = ("Wall", "Slab", "Roof", "Bloc", "Arete")
STARTING_POSITIONS = tuple(StartingPositionEnum)
COLOR_SCHEMES = (ColorSchemeEnum.LIGHT, ColorSchemeEnum.DARK, ColorSchemeEnum.SYSTEM)
POTENTIALS = tuple(RockExplorerPotentialEnum)
ROCK_QUALITIES = tuple(RockExplorerRockQualityEnum)
ROCK_TYPES = tuple(RockExplorerRockTypeEnum)
TODO_PRIORITIES = tuple(TodoPriorityEnum)


def create_migration_dummy_data():
    """Insert a production-sized graph. Refuses to run when that graph is already present."""
    ensure_secret_listeners_registered()
    add_scales()

    with app.app_context():
        if User.find_by_email("migration-user-000@localcrag.invalid"):
            raise SystemExit("Migration dummy data is already loaded.")

        timer = _Timer()
        password_hash = User.generate_hash("migration-dummy")
        users, admin = _create_users(password_hash)
        timer.mark(f"users ({len(users)})")
        _enrich_instance_settings()
        region = _enrich_region(admin)
        crags, sectors, areas = _create_topo_tree(admin)
        timer.mark(f"crags ({len(crags)}), sectors ({len(sectors)}), areas ({len(areas)})")
        lines = _create_lines(areas, admin)
        timer.mark(f"lines ({len(lines)})")
        topos_by_area = _create_topo_images(areas, admin)
        timer.mark(f"topo images ({sum(len(images) for images in topos_by_area.values())})")
        _create_line_paths(lines, topos_by_area, admin)
        timer.mark("line paths")
        ascents = _create_ascents(users, lines)
        timer.mark(f"ascents ({len(ascents)})")
        posts = _create_posts(admin)
        _create_custom_pages(admin)
        features = _create_rock_explorer(admin, crags, areas)
        _create_gallery(lines, areas, sectors, crags, admin)
        _create_map_markers(crags, sectors, areas, topos_by_area, admin)
        _create_closure_schedules(crags, sectors, areas, lines, admin)
        _create_file_links(crags, posts, admin)
        _comment_all(region, crags, sectors, areas, lines, posts, features, ascents, users)
        timer.mark("comments")
        _create_history(crags, sectors, areas, lines, admin)
        _create_todos(lines, users)
        _create_moderator_tasks(crags, sectors, areas, lines, users, admin)
        _create_notifications(users, admin)
        _create_reactions(lines, posts, users)
        _create_recent_searches(lines, crags, areas, sectors, posts, users)
        _create_rules_read_status(region, crags, sectors, users)
        _create_rankings(users, crags)
        _create_alerts(users, admin)
        _create_admin_messages(users, admin)
        _create_permissions(users)
        _create_sessions(users)
        _create_release_notes()
        timer.mark("remaining entities")
        _assert_counts(len(lines))
        db.session.commit()
        timer.mark("commit")
        logger.info("Dummy data ready in %.1fs", timer.total)


def _crag_plans():
    plans = [
        {
            "name": name,
            "sectors": sectors,
            "areas_per_sector": areas,
            "lines_per_area": lines,
            "topos_per_area": topos,
            "extra_lines": 0,
        }
        for name, sectors, areas, lines, topos in CRAG_BLUEPRINTS
    ]

    base_total = sum(plan["sectors"] * plan["areas_per_sector"] * plan["lines_per_area"] for plan in plans)
    remainder = TARGET_LINE_COUNT - base_total
    if remainder < 0:
        raise SystemExit(f"Crag blueprints already contain {base_total} lines.")
    plans[-1]["extra_lines"] = remainder
    return plans


def _create_users(password_hash: str):
    users = []
    now = _naive_utc()
    for index in range(USER_COUNT):
        user = User()
        user.email = f"migration-user-{index:03d}@localcrag.invalid"
        user.password = password_hash
        user.firstname = "Migration"
        user.lastname = f"User {index:03d}"
        user.activated = index % 11 != 0
        user.activated_at = now if user.activated else None
        user.superadmin = index == 0
        user.admin = index < 3
        user.moderator = index < 3 or index % 20 == 0
        user.member = index % 4 != 3
        if index % 25 == 0 and index:
            user.new_email = f"migration-user-{index:03d}-new@localcrag.invalid"
            user.new_email_hash = f"new-email-{index}"
            user.new_email_hash_created = _aware_utc()
        if index % 30 == 0 and index:
            user.reset_password_hash = f"reset-{index}"
            user.reset_password_hash_created = _aware_utc()
        db.session.add(user)
        users.append(user)
    db.session.flush()

    digests = (NotificationDigestFrequencyEnum.DAILY, NotificationDigestFrequencyEnum.WEEKLY)
    for index, user in enumerate(users):
        settings = AccountSettings(user_id=user.id)
        settings.language = "de" if index % 3 == 0 else "en"
        settings.color_scheme = COLOR_SCHEMES[index % len(COLOR_SCHEMES)]
        settings.notification_digest_frequency = digests[index % 2]
        settings.exclude_from_rankings = index % 17 == 0
        settings.todo_list_private = index % 13 == 0
        settings.comment_reply_mails_enabled = index % 5 != 0
        db.session.add(settings)
    db.session.flush()
    return users, users[1]


def _enrich_instance_settings():
    settings = InstanceSettings.return_it()
    if settings is None:
        settings = InstanceSettings()
        settings.instance_name = "Migration Dummy"
        settings.copyright_owner = "LocalCrag"
        db.session.add(settings)
    if not settings.map_base_layers:
        settings.map_base_layers = [
            {
                "id": "osm",
                "name": "OSM",
                "styleUrl": "https://tile.example.invalid/style.json",
                "topoDefault": True,
                "rockExplorerDefault": True,
                "defaultOverlayIds": ["approach"],
            }
        ]
    if not settings.map_overlays:
        settings.map_overlays = [
            {
                "id": "approach",
                "name": "Approach",
                "url": "https://tile.example.invalid/approach/{z}/{x}/{y}.png",
            }
        ]


def _enrich_region(admin: User) -> Region:
    region = Region.return_it()
    if region is None:
        region = Region()
        region.name = "Dummy Region"
        db.session.add(region)
    region.description = "<p>Region used by the migration check.</p>"
    region.rules = "<p>Stay on the paths and respect closures.</p>"
    region.rules_title = "Rules"
    region.rules_updated_at = _naive_utc()
    region.created_by_id = admin.id
    db.session.flush()
    return region


def _create_topo_tree(admin: User):
    crags = []
    sectors = []
    areas = []
    for crag_index, plan in enumerate(_crag_plans()):
        secret = crag_index == 0
        crag = Crag()
        crag.name = plan["name"]
        crag.short_description = f"Short description of {plan['name']}"
        crag.description = f"<p>Long description of {plan['name']}.</p>"
        crag.rules = "<p>Local rules.</p>" if crag_index % 2 == 0 else None
        crag.rules_title = "Rules" if crag.rules else None
        crag.rules_updated_at = _naive_utc() if crag.rules else None
        crag.order_index = crag_index
        crag.default_boulder_scale = "FB"
        crag.default_sport_scale = "UIAA"
        crag.secret = secret
        crag.created_by_id = admin.id
        crag.sectors_plan = plan
        db.session.add(crag)
        crags.append(crag)
    db.session.flush()

    for crag in crags:
        plan = crag.sectors_plan
        for sector_index in range(plan["sectors"]):
            sector = Sector()
            sector.name = f"{crag.name} {SECTOR_LABELS[sector_index % len(SECTOR_LABELS)]} {sector_index}"
            sector.short_description = "Sector"
            sector.description = "<p>Sector description.</p>"
            sector.rules = "<p>Sector rules.</p>" if sector_index == 0 else None
            sector.crag_id = crag.id
            sector.order_index = sector_index
            sector.secret = crag.name == CRAG_BLUEPRINTS[0][0]
            sector.created_by_id = admin.id
            sector.areas_plan = plan
            sector.sector_index = sector_index
            db.session.add(sector)
            sectors.append(sector)
    db.session.flush()

    for sector in sectors:
        plan = sector.areas_plan
        for area_index in range(plan["areas_per_sector"]):
            is_last = (
                sector.crag_id == crags[-1].id
                and sector.sector_index == plan["sectors"] - 1
                and area_index == plan["areas_per_sector"] - 1
            )
            area = Area()
            area.name = f"{sector.name} {AREA_LABELS[area_index % len(AREA_LABELS)]} {area_index}"
            area.short_description = "Area"
            area.description = "<p>Area description.</p>" if area_index % 2 == 0 else None
            area.sector_id = sector.id
            area.order_index = area_index
            area.secret = sector_is_secret(sector)
            area.created_by_id = admin.id
            area.line_budget = plan["lines_per_area"] + (plan["extra_lines"] if is_last else 0)
            area.topo_budget = plan["topos_per_area"]
            db.session.add(area)
            areas.append(area)
    db.session.flush()
    for crag in crags:
        del crag.sectors_plan
    for sector in sectors:
        del sector.areas_plan
        del sector.sector_index
    return crags, sectors, areas


def sector_is_secret(sector: Sector) -> bool:
    return sector.name.startswith(f"{CRAG_BLUEPRINTS[0][0]} ")


def _create_lines(areas: list[Area], admin: User) -> list[Line]:
    lines = []
    sequence = 0
    for area in areas:
        for _ in range(area.line_budget):
            line = Line()
            line.name = f"Line {sequence:04d}"
            line.description = "<p>Dummy line.</p>" if sequence % 4 == 0 else None
            line.area_id = area.id
            line.created_by_id = admin.id
            line.starting_position = STARTING_POSITIONS[sequence % len(STARTING_POSITIONS)]
            line.author_rating = (sequence % 5) + 1
            line.user_rating = (sequence % 5) + 1
            if sequence % 37 == 0:
                line.publication_status = PublicationStatusEnum.ARCHIVED
            line.secret = area.name.startswith(f"{CRAG_BLUEPRINTS[0][0]} ") or sequence % 29 == 0
            if sequence % 3:
                line.type = LineTypeEnum.BOULDER
                line.grade_scale = "FB"
                line.author_grade_value = (sequence % 28) + 1
            else:
                line.type = LineTypeEnum.SPORT
                line.grade_scale = "UIAA"
                line.author_grade_value = (sequence % 27) + 1
                line.routesetter = "Migration User"
                line.bolter = "Migration User"
            if sequence % 41 == 0:
                line.author_grade_value = -2
            line.user_grade_value = line.author_grade_value
            line.assumed_grade_min = line.author_grade_value if sequence % 15 == 0 else None
            line.assumed_grade_max = line.author_grade_value + 1 if line.assumed_grade_min is not None else None
            line.fa_year = 2008 + (sequence % 18)
            line.fa_name = "Migration User"
            line.drying = DryingEnum.FAST if sequence % 2 == 0 else DryingEnum.SLOW
            if "variant" in line.__table__.columns:
                line.variant = sequence % 9 == 0
            line.eliminate = sequence % 13 == 0
            line.traverse = sequence % 10 == 0
            line.highball = sequence % 8 == 0
            line.no_topout = sequence % 7 == 0
            line.overhang = sequence % 3 == 0
            line.slab = sequence % 3 == 1
            line.vertical = sequence % 3 == 2
            line.crimps = sequence % 2 == 0
            line.sloper = sequence % 2 == 1
            line.athletic = sequence % 4 == 0
            line.color = "#C2410C" if sequence % 6 == 0 else None
            if sequence % 12 == 0:
                line.videos = [{"url": "https://example.invalid/watch?v=dummy", "title": "Dummy"}]
            db.session.add(line)
            lines.append(line)
            sequence += 1
        del area.line_budget
    db.session.flush()
    return lines


def _create_topo_images(areas: list[Area], admin: User) -> dict:
    topos_by_area = {}
    superadmin = User.query.filter_by(superadmin=True).first()
    tabu_owner_id = superadmin.id if superadmin is not None else admin.id
    for area in areas:
        images = []
        for order_index in range(area.topo_budget):
            file = _file(admin, f"{area.id}-{order_index}.jpg", 2000, 1500)
            db.session.add(file)
            db.session.flush()
            topo = TopoImage()
            topo.area_id = area.id
            topo.file_id = file.id
            topo.order_index = order_index
            topo.title = f"Topo {order_index + 1}"
            topo.created_by_id = admin.id
            if order_index == area.topo_budget - 1 and area.topo_budget > 1 and area.order_index == 0:
                topo.publication_status = PublicationStatusEnum.ARCHIVED
            db.session.add(topo)
            images.append(topo)
        del area.topo_budget
        db.session.flush()
        if area.order_index % 4 == 0 and images:
            superadmin = User.query.filter_by(superadmin=True).first()
            tabu_area = TabuArea()
            tabu_area.id = "tabu-0"
            tabu_area.topo_image_id = images[0].id
            tabu_area.path = [10, 20, 40, 20, 40, 50]
            tabu_area.order_index = 0
            tabu_area.created_by_id = tabu_owner_id
            db.session.add(tabu_area)
            db.session.flush()
        topos_by_area[area.id] = images
    return topos_by_area


def _create_line_paths(lines: list[Line], topos_by_area: dict, admin: User):
    order_in_topo = {}
    for line_index, line in enumerate(lines):
        images = topos_by_area[line.area_id]
        for path_index, topo in enumerate(images):
            if path_index > 0 and line_index % 4 != 0:
                continue
            order = order_in_topo.get(topo.id, 0)
            order_in_topo[topo.id] = order + 1
            line_path = LinePath()
            line_path.line_id = line.id
            line_path.topo_image_id = topo.id
            line_path.path = _path_points(line_index, path_index)
            line_path.order_index = order
            line_path.order_index_for_line = path_index
            line_path.created_by_id = admin.id
            if path_index == 0 and line_index % 5 == 0:
                line_path.tabu_area_ids = ["tabu-0"]
            db.session.add(line_path)
    db.session.flush()


def _create_ascents(users: list[User], lines: list[Line]) -> list[Ascent]:
    ascents = []
    line_count = len(lines)
    for user_index, user in enumerate(users):
        start = (user_index * ASCENTS_PER_USER) % line_count
        for ascent_index in range(ASCENTS_PER_USER):
            line = lines[(start + ascent_index) % line_count]
            ascent = Ascent()
            ascent.line_id = line.id
            ascent.created_by_id = user.id
            ascent.grade_value = max(line.author_grade_value, 1)
            ascent.rating = (ascent_index % 5) + 1
            ascent.flash = ascent_index % 4 == 0
            ascent.fa = ascent_index == 0 and user_index % 7 == 0
            ascent.with_kneepad = ascent_index % 5 == 0
            ascent.hard = ascent_index % 6 == 0
            ascent.soft = ascent_index % 6 == 1
            ascent.comment = "Dummy ascent" if ascent_index % 3 == 0 else None
            ascent.year = 2016 + ((user_index + ascent_index) % 10)
            day = datetime.date(2018, 1, 1) + datetime.timedelta(days=(user_index * 3 + ascent_index) % 2500)
            ascent.date = day
            ascent.ascent_date = day
            db.session.add(ascent)
            ascents.append(ascent)
            if len(ascents) % 2000 == 0:
                db.session.flush()
    db.session.flush()
    return ascents


def _create_posts(admin: User) -> list[Post]:
    posts = []
    for index in range(POST_COUNT):
        post = Post()
        post.title = f"News {index:02d}"
        post.text = "<p>Conditions, new lines, and closures.</p>"
        post.created_by_id = admin.id
        db.session.add(post)
        posts.append(post)
    db.session.flush()
    return posts


def _create_custom_pages(admin: User) -> list[MenuPage]:
    pages = []
    for index, title in enumerate(MENU_PAGE_TITLES):
        page = MenuPage()
        page.title = title
        page.text = f"<p>{title} for the migration dataset.</p>"
        page.created_by_id = admin.id
        db.session.add(page)
        pages.append(page)
    db.session.flush()
    for index, page in enumerate(pages):
        item = MenuItem()
        item.type = MenuItemTypeEnum.MENU_PAGE
        item.position = MenuItemPositionEnum.BOTTOM
        item.order_index = 10 + index
        item.menu_page_id = page.id
        item.created_by_id = admin.id
        db.session.add(item)
    history_item = MenuItem()
    history_item.type = MenuItemTypeEnum.HISTORY
    history_item.position = MenuItemPositionEnum.TOP
    history_item.order_index = 10
    history_item.created_by_id = admin.id
    db.session.add(history_item)
    url_item = MenuItem()
    url_item.type = MenuItemTypeEnum.URL
    url_item.position = MenuItemPositionEnum.TOP
    url_item.order_index = 11
    url_item.title = "Weather"
    url_item.url = "https://example.invalid/weather"
    url_item.created_by_id = admin.id
    db.session.add(url_item)
    db.session.flush()
    return pages


def _create_rock_explorer(admin: User, crags: list[Crag], areas: list[Area]) -> list[RockExplorerFeature]:
    features = []
    for index in range(ROCK_EXPLORER_COUNT):
        feature = RockExplorerFeature()
        published = index % 4 != 0
        feature.status = RockExplorerFeatureStatusEnum.PUBLISHED if published else RockExplorerFeatureStatusEnum.DRAFT
        feature.title = f"Explorer {index:02d}" if published or index % 2 == 0 else None
        feature.description = "<p>Undeveloped rock.</p>"
        feature.potential = POTENTIALS[index % len(POTENTIALS)]
        feature.rock_quality = ROCK_QUALITIES[index % len(ROCK_QUALITIES)]
        feature.rock_type = ROCK_TYPES[index % len(ROCK_TYPES)]
        feature.grade_line_type = LineTypeEnum.BOULDER if index % 2 == 0 else LineTypeEnum.SPORT
        feature.grade_scale = "FB" if feature.grade_line_type == LineTypeEnum.BOULDER else "UIAA"
        feature.grade_value_min = 10
        feature.grade_value_max = 18
        feature.access_issues = [RockExplorerAccessIssueEnum.NSG.value] if index % 3 == 0 else []
        feature.created_by_id = admin.id
        feature.recording_device_id = f"device-{index}" if index % 2 == 0 else None
        feature.recording_updated_at = _naive_utc() if feature.recording_device_id else None
        lng = 8.5 + index / 100
        lat = 46.4 + index / 100
        if index % 2 == 0:
            feature.geometry = {"type": "Point", "coordinates": [lng, lat]}
        else:
            feature.geometry = {
                "type": "Polygon",
                "coordinates": [[[lng, lat], [lng + 0.01, lat], [lng + 0.01, lat + 0.01], [lng, lat]]],
            }
        feature.parking_sites = [
            {"id": f"park-{index}", "lat": lat, "lng": lng, "title": "Parking", "description": "Dummy parking"}
        ]
        feature.paths = [
            {
                "id": f"path-{index}",
                "source": "manual",
                "title": "Approach",
                "description": None,
                "geometry": {"type": "LineString", "coordinates": [[lng, lat], [lng + 0.005, lat + 0.005]]},
            }
        ]
        db.session.add(feature)
        features.append(feature)
    db.session.flush()

    for index, feature in enumerate(features):
        target = crags[index % len(crags)] if index % 2 == 0 else areas[index % len(areas)]
        tag = Tag()
        tag.object_type = target.__class__.__name__
        tag.object_id = target.id
        db.session.add(tag)
        db.session.flush()
        feature.topo_links = [tag]
    db.session.flush()
    return features


def _create_gallery(lines, areas, sectors, crags, admin: User):
    targets = (
        [("Line", line.id) for line in lines[:40]]
        + [("Area", area.id) for area in areas[:20]]
        + [("Sector", sector.id) for sector in sectors[:20]]
        + [("Crag", crag.id) for crag in crags]
    )
    for index in range(GALLERY_IMAGE_COUNT):
        object_type, object_id = targets[index % len(targets)]
        file = _file(admin, f"gallery-{index}.jpg", 1200, 900)
        db.session.add(file)
        db.session.flush()
        tag = Tag()
        tag.object_type = object_type
        tag.object_id = object_id
        db.session.add(tag)
        image = GalleryImage()
        image.file_id = file.id
        image.description = f"Gallery image {index}"
        image.lat = 46.5 + (index % 10) / 100
        image.lng = 8.7 + (index % 10) / 100
        image.tags = [tag]
        image.created_by_id = admin.id
        db.session.add(image)
        if index % 20 == 19:
            db.session.flush()
    db.session.flush()


def _create_map_markers(crags, sectors, areas, topos_by_area, admin: User):
    for index, crag in enumerate(crags):
        _marker(admin, MapMarkerType.CRAG, 46.3 + index / 50, 8.4 + index / 50, crag_id=crag.id, name=crag.name)
        _marker(
            admin,
            MapMarkerType.PARKING,
            46.29 + index / 50,
            8.39 + index / 50,
            crag_id=crag.id,
            name=f"{crag.name} parking",
        )
        if index % 2 == 0:
            _marker(
                admin,
                MapMarkerType.ACCESS_POINT,
                46.28 + index / 50,
                8.38 + index / 50,
                crag_id=crag.id,
                name=f"{crag.name} access",
            )
    for index, sector in enumerate(sectors[:20]):
        _marker(admin, MapMarkerType.SECTOR, 46.2 + index / 80, 8.3 + index / 80, sector_id=sector.id, name=sector.name)
    for index, area in enumerate(areas[:20]):
        _marker(admin, MapMarkerType.AREA, 46.1 + index / 80, 8.2 + index / 80, area_id=area.id, name=area.name)
    topo_markers = 0
    for images in topos_by_area.values():
        if topo_markers >= 10:
            break
        topo = images[0]
        _marker(admin, MapMarkerType.TOPO_IMAGE, 46.0, 8.1, topo_image_id=topo.id, name=topo.title)
        topo_markers += 1
    _marker(admin, MapMarkerType.OTHER, 46.6, 8.8, crag_id=crags[0].id, name="Water")
    db.session.flush()


def _marker(admin, marker_type, lat, lng, name, **foreign_keys):
    marker = MapMarker()
    marker.type = marker_type
    marker.lat = lat
    marker.lng = lng
    marker.name = name
    marker.description = name
    marker.created_by_id = admin.id
    for key, value in foreign_keys.items():
        setattr(marker, key, value)
    db.session.add(marker)


def _create_closure_schedules(crags, sectors, areas, lines, admin: User):
    for crag in crags[:3]:
        _schedule(
            admin,
            ClosureScheduleTypeEnum.ANNUAL,
            crag_id=crag.id,
            start_month=3,
            start_day=1,
            end_month=7,
            end_day=31,
            reason="Nesting",
        )
    for sector in sectors[:2]:
        sector.closed = True
        sector.closure_is_permanent = True
        _schedule(admin, ClosureScheduleTypeEnum.PERMANENT, sector_id=sector.id, reason="Private land")
    for area in areas[:4]:
        area.closed = True
        _schedule(
            admin,
            ClosureScheduleTypeEnum.FIXED,
            area_id=area.id,
            start_date=datetime.date(2026, 10, 1),
            end_date=datetime.date(2026, 10, 31),
            reason="Event",
        )
    for line in lines[:10]:
        _schedule(
            admin,
            ClosureScheduleTypeEnum.ANNUAL,
            line_id=line.id,
            start_month=11,
            start_day=1,
            end_month=2,
            end_day=28,
            reason="Wet season",
        )
    db.session.flush()


def _schedule(admin, schedule_type, reason, **foreign_keys):
    schedule = ClosureSchedule()
    schedule.schedule_type = schedule_type
    schedule.reason = reason
    schedule.created_by_id = admin.id
    for key, value in foreign_keys.items():
        setattr(schedule, key, value)
    db.session.add(schedule)


def _create_file_links(crags, posts, admin: User):
    for index, crag in enumerate(crags[:3]):
        file = _file(admin, f"inline-crag-{index}.jpg", 800, 600)
        db.session.add(file)
        db.session.flush()
        crag.description = f'<p><img src="/uploads/{file.filename}" alt=""></p>'
        link = FileLink()
        link.file_id = file.id
        link.object_type = "Crag"
        link.object_id = crag.id
        link.field_name = "description"
        db.session.add(link)
    for index, post in enumerate(posts[:2]):
        file = _file(admin, f"inline-post-{index}.jpg", 800, 600)
        db.session.add(file)
        db.session.flush()
        post.text = f'<p><img src="/uploads/{file.filename}" alt=""></p>'
        link = FileLink()
        link.file_id = file.id
        link.object_type = "Post"
        link.object_id = post.id
        link.field_name = "text"
        db.session.add(link)
    portrait = _file(admin, "crag-portrait.jpg", 600, 800)
    db.session.add(portrait)
    db.session.flush()
    crags[1].portrait_image_id = portrait.id
    region_image = _file(admin, "region.jpg", 1600, 900)
    db.session.add(region_image)
    db.session.flush()
    region = Region.return_it()
    region.image_id = region_image.id


def _comment_all(region, crags, sectors, areas, lines, posts, features, ascents, users):
    pairs = [("Region", region.id)]
    pairs += [("Crag", crag.id) for crag in crags]
    pairs += [("Sector", sector.id) for sector in sectors]
    pairs += [("Area", area.id) for area in areas]
    pairs += [("Line", line.id) for line in lines]
    pairs += [("Post", post.id) for post in posts]
    pairs += [("RockExplorerFeature", feature.id) for feature in features]
    pairs += [("Ascent", ascent.id) for ascent in ascents]
    parents = []
    for index, (object_type, object_id) in enumerate(pairs):
        comment = Comment()
        comment.message = f"<p>Comment on {object_type}.</p>"
        comment.object_type = object_type
        comment.object_id = object_id
        comment.created_by_id = users[index % len(users)].id
        comment.is_deleted = index % 40 == 0
        db.session.add(comment)
        if index % 20 == 0:
            parents.append(comment)
        if index % 2000 == 1999:
            db.session.flush()
    db.session.flush()
    for index, parent in enumerate(parents):
        reply = Comment()
        reply.message = "<p>Reply.</p>"
        reply.object_type = parent.object_type
        reply.object_id = parent.object_id
        reply.parent_id = parent.id
        reply.root_id = parent.id
        reply.created_by_id = users[(index + 1) % len(users)].id
        db.session.add(reply)
    db.session.flush()


def _create_history(crags, sectors, areas, lines, admin: User):
    for object_type, entities in (
        ("Crag", crags),
        ("Sector", sectors),
        ("Area", areas),
        ("Line", lines),
    ):
        for entity in entities:
            item = HistoryItem()
            item.type = HistoryItemTypeEnum.CREATED
            item.object_type = object_type
            item.object_id = entity.id
            item.created_by_id = admin.id
            db.session.add(item)
    for line in lines[:200]:
        item = HistoryItem()
        item.type = HistoryItemTypeEnum.UPDATED
        item.object_type = "Line"
        item.object_id = line.id
        item.property_name = "author_grade_value"
        item.old_value = "16"
        item.new_value = "18"
        item.created_by_id = admin.id
        db.session.add(item)
    db.session.flush()


def _create_todos(lines, users):
    for index, line in enumerate(lines[:150]):
        todo = Todo()
        todo.line_id = line.id
        todo.priority = TODO_PRIORITIES[index % len(TODO_PRIORITIES)]
        todo.created_by_id = users[index % 40].id
        db.session.add(todo)


def _create_moderator_tasks(crags, sectors, areas, lines, users, admin: User):
    targets = (
        [("Line", line.id) for line in lines[:24]]
        + [("Area", area.id) for area in areas[:8]]
        + [("Sector", sector.id) for sector in sectors[:6]]
        + [("Crag", crag.id) for crag in crags]
    )
    now = _naive_utc()
    for index, (object_type, object_id) in enumerate(targets):
        task = ModeratorTask()
        task.title = f"Review {object_type} {index}"
        task.description = "Dummy moderator task"
        task.object_type = object_type
        task.object_id = object_id
        task.assigned_to_id = users[1].id
        task.completed = index % 3 == 0
        task.created_by_id = admin.id
        if task.completed:
            task.time_finished = now
            task.finished_by_id = users[1].id
        db.session.add(task)


def _create_notifications(users, admin: User):
    for index, note_type in enumerate(NotificationTypeEnum):
        for copy in range(4):
            notification = Notification()
            notification.user_id = users[(index + copy) % len(users)].id
            notification.type = note_type
            notification.actor_id = admin.id
            notification.entity_type = "Line"
            notification.message = f"Dummy {note_type.value}"
            if copy % 2 == 0:
                notification.delivered_at = _naive_utc()
            if copy == 3:
                notification.dismissed_at = _naive_utc()
            db.session.add(notification)


def _create_reactions(lines, posts, users):
    for index, line in enumerate(lines[:60]):
        reaction = Reaction()
        reaction.target_type = "Line"
        reaction.target_id = line.id
        reaction.emoji = "🔥" if index % 2 else "👍"
        reaction.created_by_id = users[index % 15].id
        db.session.add(reaction)
    for index, post in enumerate(posts):
        reaction = Reaction()
        reaction.target_type = "Post"
        reaction.target_id = post.id
        reaction.emoji = "❤️"
        reaction.created_by_id = users[index % 15].id
        db.session.add(reaction)


def _create_recent_searches(lines, crags, areas, sectors, posts, users):
    entries = (
        [("Line", line.id) for line in lines[:40]]
        + [("Crag", crag.id) for crag in crags]
        + [("Area", area.id) for area in areas[:15]]
        + [("Sector", sector.id) for sector in sectors[:15]]
        + [("Post", post.id) for post in posts]
    )
    for index, (object_type, object_id) in enumerate(entries):
        search = RecentSearch()
        search.user_id = users[index % 25].id
        search.object_type = object_type
        search.object_id = object_id
        db.session.add(search)


def _create_rules_read_status(region, crags, sectors, users):
    for user in users[:25]:
        _rules_status(user, "Region", region.id)
    for index, crag in enumerate(crags):
        for offset in range(8):
            _rules_status(users[index + offset], "Crag", crag.id)
    for index, sector in enumerate(sectors[:12]):
        _rules_status(users[index % len(users)], "Sector", sector.id)


def _rules_status(user: User, entity_type: str, entity_id):
    status = RulesReadStatus()
    status.user_id = user.id
    status.entity_type = entity_type
    status.entity_id = entity_id
    status.acknowledged_rules_updated_at = _naive_utc()
    db.session.add(status)


def _create_rankings(users, crags):
    for index, user in enumerate(users[:50]):
        _ranking(user, LineTypeEnum.BOULDER, index, secret=False)
        if index < 20:
            _ranking(user, LineTypeEnum.SPORT, index, secret=False)
        if index < 10:
            _ranking(user, LineTypeEnum.BOULDER, index, secret=False, crag_id=crags[index % len(crags)].id)
        if index < 5:
            _ranking(user, LineTypeEnum.BOULDER, index, secret=True)


def _ranking(user, line_type, index, secret, crag_id=None):
    ranking = Ranking()
    ranking.user_id = user.id
    ranking.type = line_type
    ranking.crag_id = crag_id
    ranking.secret = secret
    ranking.top_10 = 20 - (index % 5)
    ranking.top_50 = 18 - (index % 5)
    ranking.top_values = [20, 18, 16]
    ranking.total_count = ASCENTS_PER_USER
    ranking.rank_top_10 = index + 1
    ranking.rank_top_50 = index + 1
    ranking.rank_total_count = index + 1
    db.session.add(ranking)


def _create_alerts(users, admin: User):
    now = _naive_utc()
    specs = (
        (AppAlertSeverityEnum.INFO, now - datetime.timedelta(days=2), now + datetime.timedelta(days=5), "Info banner"),
        (
            AppAlertSeverityEnum.WARNING,
            now - datetime.timedelta(days=1),
            now + datetime.timedelta(days=2),
            "Wet rock",
        ),
        (
            AppAlertSeverityEnum.DANGER,
            now - datetime.timedelta(days=30),
            now - datetime.timedelta(days=1),
            "Past closure",
        ),
    )
    alerts = []
    for severity, starts_at, ends_at, message in specs:
        alert = AppAlert()
        alert.message = message
        alert.severity = severity
        alert.starts_at = starts_at
        alert.ends_at = ends_at
        alert.read_more_url = "https://example.invalid/alert"
        alert.created_by_id = admin.id
        db.session.add(alert)
        alerts.append(alert)
    db.session.flush()
    for user in users[:15]:
        dismissal = AppAlertDismissal()
        dismissal.user_id = user.id
        dismissal.alert_id = alerts[0].id
        dismissal.dismissed_at = now
        db.session.add(dismissal)


def _create_admin_messages(users, admin: User):
    messages = []
    for index in range(5):
        message = AdminMessage()
        message.title = f"Admin note {index}"
        message.text = "<p>Instance announcement.</p>"
        message.created_by_id = admin.id
        db.session.add(message)
        messages.append(message)
    db.session.flush()
    for index, message in enumerate(messages):
        notification = Notification()
        notification.user_id = users[index].id
        notification.type = NotificationTypeEnum.ADMIN_MESSAGE
        notification.actor_id = admin.id
        notification.entity_type = "AdminMessage"
        notification.entity_id = message.id
        notification.message = message.title
        db.session.add(notification)


def _create_sessions(users):
    expires_at = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    for user in users[:20]:
        auth_session = AuthSession(
            id=AuthSession.generate_id(),
            user_id=user.id,
            csrf_token=AuthSession.generate_csrf_token(),
            expires_at=expires_at,
        )
        db.session.add(auth_session)


def _create_release_notes():
    if ReleaseNoteItem.query.filter_by(item_key="migration-dummy-feature").first():
        return
    bundle = ReleaseNoteBundle()
    db.session.add(bundle)
    db.session.flush()
    for item_key, note_type in (
        ("migration-dummy-feature", ReleaseNoteItemTypeEnum.FEATURE),
        ("migration-dummy-fix", ReleaseNoteItemTypeEnum.FIX),
    ):
        item = ReleaseNoteItem()
        item.item_key = item_key
        item.note_type = note_type
        item.bundle_id = bundle.id
        db.session.add(item)


def _file(admin: User, filename: str, width: int, height: int) -> File:
    file = File()
    file.original_filename = filename
    file.filename = f"migration-{filename}"
    file.width = width
    file.height = height
    file.thumbnail_xs = True
    file.thumbnail_s = True
    file.thumbnail_m = width >= 1000
    file.focus_y = 0.4
    file.created_by_id = admin.id
    return file


def _path_points(line_index: int, path_index: int) -> list[float]:
    start_x = 8 + (line_index % 40)
    start_y = 75 - path_index * 5
    return [
        float(start_x),
        float(start_y),
        float(start_x + 6),
        float(start_y - 25),
        float(start_x + 3),
        float(start_y - 55),
    ]


def _create_permissions(users):
    denied = next(user for user in users if not user.moderator)
    permission = Permission()
    permission.user_id = denied.id
    permission.key = SUGGESTION_CREATE
    permission.effect = PermissionEffectEnum.DENY
    db.session.add(permission)
    db.session.flush()


def _assert_counts(line_count: int):
    migration_users = User.query.filter(User.email.like("migration-user-%@localcrag.invalid")).count()
    counts = {
        "users": migration_users,
        "crags": Crag.query.count(),
        "sectors": Sector.query.count(),
        "areas": Area.query.count(),
        "lines": Line.query.count(),
        "topo_images": TopoImage.query.count(),
        "line_paths": LinePath.query.count(),
        "ascents": Ascent.query.count(),
        "comments": Comment.query.count(),
        "posts": Post.query.count(),
        "history_items": HistoryItem.query.count(),
        "gallery_images": GalleryImage.query.count(),
        "menu_pages": MenuPage.query.count(),
        "rock_explorer_features": RockExplorerFeature.query.count(),
        "map_markers": MapMarker.query.count(),
        "closure_schedules": ClosureSchedule.query.count(),
        "todos": Todo.query.count(),
        "moderator_tasks": ModeratorTask.query.count(),
        "notifications": Notification.query.count(),
        "reactions": Reaction.query.count(),
        "recent_searches": RecentSearch.query.count(),
        "rules_read_status": RulesReadStatus.query.count(),
        "rankings": Ranking.query.count(),
        "app_alerts": AppAlert.query.count(),
        "admin_messages": AdminMessage.query.count(),
        "sessions": AuthSession.query.count(),
        "permissions": Permission.query.count(),
        "file_links": FileLink.query.count(),
        "secret_topo_entities": SecretTopoEntity.query.count(),
    }
    for name, count in counts.items():
        logger.info("%s: %s", name, count)
    expected = {
        "users": USER_COUNT,
        "crags": len(CRAG_BLUEPRINTS),
        "lines": line_count,
        "ascents": USER_COUNT * ASCENTS_PER_USER,
        "posts": POST_COUNT,
        "permissions": 1,
        "gallery_images": GALLERY_IMAGE_COUNT,
        "rock_explorer_features": ROCK_EXPLORER_COUNT,
    }
    for name, count in expected.items():
        if counts[name] != count:
            raise SystemExit(f"Expected {count} {name}, found {counts[name]}.")
    if line_count != TARGET_LINE_COUNT:
        raise SystemExit(f"Expected {TARGET_LINE_COUNT} lines, built {line_count}.")
    for object_type, model in (
        ("Region", Region),
        ("Crag", Crag),
        ("Sector", Sector),
        ("Area", Area),
        ("Line", Line),
        ("Post", Post),
        ("RockExplorerFeature", RockExplorerFeature),
        ("Ascent", Ascent),
    ):
        commented = (
            db.session.query(func.count(func.distinct(Comment.object_id)))
            .filter(Comment.object_type == object_type)
            .scalar()
        )
        total = model.query.count()
        if commented != total:
            raise SystemExit(f"Expected a comment on every {object_type} ({total}), found {commented}.")


def _aware_utc():
    return datetime.datetime.now(datetime.timezone.utc)


def _naive_utc():
    return _aware_utc().replace(tzinfo=None)


class _Timer:
    def __init__(self):
        self.started = time.perf_counter()
        self.last = self.started

    def mark(self, label: str):
        now = time.perf_counter()
        logger.info("%s in %.1fs", label, now - self.last)
        self.last = now

    @property
    def total(self) -> float:
        return time.perf_counter() - self.started


if __name__ == "__main__":
    create_migration_dummy_data()
