import os
import shutil
from datetime import timedelta

import boto3
import botocore
import moto
import pytest
from flask import current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from sqlalchemy import URL, create_engine, text
from sqlalchemy.event import listen
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import scoped_session, sessionmaker

from app import app
from extensions import db
from models.area import Area
from models.ascent import Ascent
from models.crag import Crag
from models.enums.line_type_enum import LineTypeEnum
from models.enums.map_marker_type_enum import MapMarkerType
from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.enums.starting_position_enum import StartingPositionEnum
from models.file import File
from models.instance_settings import InstanceSettings
from models.line import Line
from models.line_path import LinePath
from models.map_marker import MapMarker
from models.menu_item import MenuItem
from models.menu_page import MenuPage
from models.mixins.has_slug import update_slugs
from models.mixins.is_searchable import create_searchables, update_searchables
from models.post import Post
from models.ranking import Ranking
from models.region import Region
from models.revoked_token import RevokedToken
from models.sector import Sector
from models.topo_image import TopoImage
from models.user import User


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    with app.app_context():
        try:
            # To create the database if not exists, we need to remove it from the URL
            main_url = db.engine.url
            engine = create_engine(
                URL.create(
                    main_url.drivername,
                    main_url.username,
                    main_url.password,
                    main_url.host,
                    main_url.port,
                    "postgres",
                    main_url.query,
                )
            )
            with engine.connect() as conn:
                conn.execute(text("commit"))
                conn.execute(text(f"CREATE DATABASE {main_url.database}"))
        except ProgrammingError:
            # Database already exists
            pass

        db.drop_all()  # In case a previous cleanup failed
        db.create_all()
        fill_db_with_sample_data()

        yield None
        db.drop_all()


@pytest.fixture(autouse=True)
def db_session():
    with app.app_context():
        connection = db.engine.connect()
        transaction = connection.begin()
        saved_session = db.session
        db.session = scoped_session(sessionmaker(bind=connection))
        # We need to re-register all handler, as we change the session
        listen(db.session, "before_flush", update_slugs)
        listen(db.session, "before_flush", update_searchables)
        listen(db.session, "after_flush", create_searchables)
        yield db.session
        transaction.rollback()
        connection.close()
        db.session.remove()
        db.session = saved_session


@pytest.fixture
def client():
    # Monkey patch test_client to create a nicer API for authenticated requests
    client = app.test_client()
    client.open_wrapped = client.open.__get__(client, client.__class__)

    def open_wrapper(self, *args, **kwargs):
        headers = kwargs.get("headers", {})
        if "token" in kwargs:
            headers["Authorization"] = f"Bearer {kwargs['token']}"
            del kwargs["token"]
        kwargs["headers"] = headers
        return client.open_wrapped(*args, **kwargs)

    client.open = open_wrapper.__get__(client, client.__class__)
    return client


@pytest.fixture()
def gym_mode():
    instance_settings = InstanceSettings.return_it()
    instance_settings.gym_mode = True
    db.session.add(instance_settings)


@pytest.fixture(scope="session")
def admin_token():
    return create_access_token(
        identity="admin@localcrag.invalid.org",
        additional_claims={"admin": True, "moderator": True, "member": True},
        expires_delta=timedelta(days=1),
    )


@pytest.fixture(scope="session")
def admin_refresh_token():
    return create_refresh_token(
        identity="admin@localcrag.invalid.org",
        additional_claims={"admin": True, "moderator": True, "member": True},
        expires_delta=timedelta(days=1),
    )


@pytest.fixture(scope="session")
def moderator_token():
    return create_access_token(
        identity="moderator@localcrag.invalid.org",
        additional_claims={"admin": False, "moderator": True, "member": True},
        expires_delta=timedelta(days=1),
    )


@pytest.fixture(scope="session")
def member_token():
    return create_access_token(
        identity="member@localcrag.invalid.org",
        additional_claims={"admin": False, "moderator": False, "member": True},
        expires_delta=timedelta(days=1),
    )


@pytest.fixture(scope="session")
def user_token():
    return create_access_token(
        identity="user@localcrag.invalid.org",
        additional_claims={"admin": False, "moderator": False, "member": False},
        expires_delta=timedelta(days=1),
    )


@pytest.fixture
def s3_mock():
    with app.app_context():
        mock = moto.mock_aws()
        try:
            mock.start()
            session = boto3.session.Session()
            client = session.client(
                "s3",
                endpoint_url=current_app.config["SPACES_ENDPOINT"],
                config=botocore.config.Config(s3={"addressing_style": current_app.config["SPACES_ADDRESSING"]}),
                region_name=current_app.config["SPACES_REGION"],
                aws_access_key_id=current_app.config["SPACES_ACCESS_KEY"],
                aws_secret_access_key=current_app.config["SPACES_SECRET_KEY"],
            )
            client.create_bucket(
                Bucket=app.config["SPACES_BUCKET"],
                CreateBucketConfiguration={"LocationConstraint": app.config["SPACES_REGION"]},
            )
            yield client
        finally:
            mock.stop()


def remove_upload_test_files():
    extensions = ["jpg", "jpeg", "png", "bmp", "gif", "pdf"]
    for extension in extensions:
        if os.path.exists("uploads/test-uuid.{}".format(extension)):
            os.remove("uploads/test-uuid.{}".format(extension))
        if os.path.exists("uploads/test-uuid_xs.{}".format(extension)):
            os.remove("uploads/test-uuid_xs.{}".format(extension))
        if os.path.exists("uploads/test-uuid_s.{}".format(extension)):
            os.remove("uploads/test-uuid_s.{}".format(extension))
        if os.path.exists("uploads/test-uuid_m.{}".format(extension)):
            os.remove("uploads/test-uuid_m.{}".format(extension))
        if os.path.exists("uploads/test-uuid_l.{}".format(extension)):
            os.remove("uploads/test-uuid_l.{}".format(extension))
        if os.path.exists("uploads/test-uuid_xl.{}".format(extension)):
            os.remove("uploads/test-uuid_xl.{}".format(extension))


def copy_required_upload_files():
    """
    Copies all images that need to physically exist for the tests (not just in the DB but as file).
    """
    if not os.path.isdir("uploads"):
        os.makedirs("uploads")

    # Reaction formular image for PDF generator test
    shutil.copyfile("../tests/assets/test_image_271_186.png", "uploads/6bbf1ddf-81d0-4229-825c-efb7633eb837.png")
    # Files used as analysis PDF
    shutil.copyfile("../tests/assets/test_pdf.pdf", "uploads/vx-200-manual.pdf")
    shutil.copyfile("../tests/assets/test_pdf.pdf", "uploads/vx-200-manual-2.pdf")


@pytest.fixture
def clean_test_uploads():
    remove_upload_test_files()


@pytest.fixture(scope="session", autouse=True)
def clean_uploads_after_all_tests():
    remove_upload_test_files()
    copy_required_upload_files()


def fill_db_with_sample_data():
    user = User()
    user.email = "admin@localcrag.invalid.org"
    user.password = User.generate_hash("admin")
    user.firstname = "admin"
    user.lastname = "admin"
    user.activated = True
    user.superadmin = True
    user.admin = True
    user.moderator = True
    user.member = True
    db.session.add(user)

    user = User()
    user.email = "moderator@localcrag.invalid.org"
    user.password = user.generate_hash("moderator")
    user.firstname = "moderator"
    user.lastname = "moderator"
    user.activated = True
    user.superadmin = False
    user.admin = False
    user.moderator = True
    user.member = True
    db.session.add(user)

    user = User()
    user.email = "member@localcrag.invalid.org"
    user.password = User.generate_hash("member")
    user.firstname = "member"
    user.lastname = "member"
    user.activated = True
    user.superadmin = False
    user.admin = False
    user.moderator = False
    user.member = True
    db.session.add(user)

    user = User()
    user.email = "user@localcrag.invalid.org"
    user.password = User.generate_hash("user")
    user.firstname = "user"
    user.lastname = "user"
    user.activated = True
    user.superadmin = False
    user.admin = False
    user.moderator = False
    user.member = False
    db.session.add(user)

    adminId = User.find_by_email("admin@localcrag.invalid.org").id

    region = Region()
    region.id = "d2c864b4-ca80-4d01-a8bf-41521182b5d4"
    region.name = "Tessin"
    region.description = "Tolle Region"
    db.session.add(region)

    crag = Crag()
    crag.name = "Brione"
    crag.description = "<p>Lange Beschreibung zu Brione.</p>"
    crag.rules = "<p>Briones Regeln.</p>"
    crag.short_description = "Kurze Beschreibung zu Brione"
    crag.order_index = 0
    db.session.add(crag)

    crag = Crag()
    crag.name = "Chironico"
    crag.description = "<p>Lange Beschreibung zu Chironico</p>"
    crag.rules = "<p>Briones Regeln.</p>"
    crag.short_description = "Kurze Beschreibung zu Chironico"
    crag.order_index = 1
    db.session.add(crag)

    sector = Sector()
    sector.name = "Schattental"
    sector.description = "<p>Lange Beschreibung zum Schattental</p>"
    sector.short_description = "Kurze Beschreibung zum Schattental"
    sector.crag_id = Crag.get_id_by_slug("brione")
    sector.order_index = 0
    db.session.add(sector)

    sector = Sector()
    sector.name = "Oben"
    sector.description = ""
    sector.short_description = ""
    sector.crag_id = Crag.get_id_by_slug("brione")
    sector.order_index = 1
    db.session.add(sector)

    area = Area()
    area.name = "Dritter Block von links"
    area.description = "<p>Allgemeine Infos zum dritten Block von links.</p>"
    area.sector_id = Sector.get_id_by_slug("schattental")
    area.order_index = 0
    db.session.add(area)

    area = Area()
    area.name = "Noch ein Bereich"
    area.description = ""
    area.sector_id = Sector.get_id_by_slug("schattental")
    area.order_index = 1
    db.session.add(area)

    line = Line()
    line.name = "Treppe"
    line.description = "<p>Eine normale Treppe.</p>"
    line.type = LineTypeEnum.BOULDER
    line.area_id = Area.get_id_by_slug("dritter-block-von-links")
    line.rating = 1
    line.grade_name = "1"
    line.grade_scale = "FB"
    line.grade_value = 1
    line.starting_position = StartingPositionEnum.STAND
    db.session.add(line)

    line = Line()
    line.name = "Super-Spreader"
    line.description = "<p>Geiler Kühlschrankboulder!</p>"
    line.type = LineTypeEnum.BOULDER
    line.area_id = Area.get_id_by_slug("dritter-block-von-links")
    line.rating = 5
    line.fa_year = 2024
    line.fa_name = "Felix Engelmann"
    line.grade_name = "8A"
    line.grade_scale = "FB"
    line.grade_value = 22
    line.starting_position = StartingPositionEnum.SIT
    line.no_topout = True
    line.overhang = True
    line.athletic = True
    line.cruxy = True
    line.sloper = True
    line.compression = True
    line.videos = [{"url": "https://www.youtube.com/watch?v=8A_9oHuTkQA", "title": ""}]
    db.session.add(line)

    ascent = Ascent()
    ascent.fa = True
    ascent.hard = True
    ascent.grade_name = "8A"
    ascent.grade_scale = "FB"
    ascent.rating = 3
    ascent.comment = "Yeeha!"
    ascent.date = "2024-04-16"
    ascent.ascent_date = "2024-04-16"
    ascent.created_by_id = adminId
    ascent.with_kneepad = True
    ascent.line_id = Line.get_id_by_slug("super-spreader")
    ascent.area_id = Area.get_id_by_slug("dritter-block-von-links")
    ascent.sector_id = Sector.get_id_by_slug("schattental")
    ascent.crag_id = Crag.get_id_by_slug("brione")
    db.session.add(ascent)

    post = Post()
    post.title = "Mein erster Post"
    post.text = "<p>Juhu, sie haben Post!</p>"
    post.created_by_id = adminId
    db.session.add(post)

    post = Post()
    post.title = "Noch ein Post"
    post.text = "<p>Was steht hier nur für ein Quatsch?</p>"
    post.created_by_id = adminId
    db.session.add(post)

    file = File()
    file.original_filename = "test.jpg"
    file.width = 200
    file.height = 200
    file.thumbnail_xs = True
    file.thumbnail_s = True
    file.filename = "ed22745d-ce4a-49f1-b9af-d29918d07923.jpg"
    file.created_by_id = adminId
    db.session.add(file)

    file = File()
    file.original_filename = "Hotpot (5).png"
    file.width = 512
    file.height = 512
    file.thumbnail_xs = True
    file.thumbnail_s = True
    file.thumbnail_m = True
    file.filename = "f7b185e048994c178d1bcee8364a0eed.png"
    file.created_by_id = adminId
    db.session.add(file)

    file = File()
    file.original_filename = "signal-2023-03-05-020104_003.jpeg"
    file.width = 1152
    file.height = 2048
    file.thumbnail_xs = True
    file.thumbnail_s = True
    file.thumbnail_m = True
    file.thumbnail_l = True
    file.thumbnail_xl = True
    file.filename = "556c457bf2984a3d83d34d8fa486fea9.jpeg"
    file.created_by_id = adminId
    db.session.add(file)

    file = File()
    file.original_filename = "Hotpot (5).png"
    file.width = 512
    file.height = 512
    file.thumbnail_xs = True
    file.thumbnail_s = True
    file.thumbnail_m = True
    file.filename = "f4947937541045fdade9cfdf5cdb5afa.png"
    file.created_by_id = adminId
    db.session.add(file)

    file = File()
    file.original_filename = "signal-2023-03-05-020104_003.jpeg"
    file.width = 1152
    file.height = 2048
    file.thumbnail_xs = True
    file.thumbnail_s = True
    file.thumbnail_m = True
    file.thumbnail_l = True
    file.thumbnail_xl = True
    file.filename = "70ea657f1c744d8da30b0104651129b0.jpeg"
    file.created_by_id = adminId
    db.session.add(file)

    file = File()
    file.original_filename = "Love it or leave it.JPG"
    file.width = 3456
    file.height = 4608
    file.thumbnail_xs = True
    file.thumbnail_s = True
    file.thumbnail_m = True
    file.thumbnail_l = True
    file.thumbnail_xl = True
    file.filename = "678a49a6ebc94a55afcac1185af80ce6.jpeg"
    file.created_by_id = adminId
    db.session.add(file)

    file = File()
    file.original_filename = "Hate it or love it.JPG"
    file.width = 4608
    file.height = 3456
    file.thumbnail_xs = True
    file.thumbnail_s = True
    file.thumbnail_m = True
    file.thumbnail_l = True
    file.thumbnail_xl = True
    file.filename = "1847c84526574b0f9a15f258cf9a0de8.jpeg"
    file.created_by_id = adminId
    db.session.add(file)

    instance_settings = InstanceSettings()
    instance_settings.instance_name = "My LocalCrag"
    instance_settings.copyright_owner = "Your name goes here"
    instance_settings.arrow_color = "#FFE016"
    instance_settings.arrow_text_color = "#000000"
    instance_settings.arrow_highlight_color = "#FF0000"
    instance_settings.arrow_highlight_text_color = "#FFFFFF"
    instance_settings.bar_chart_color = "rgb(213, 30, 38)"
    instance_settings.matomo_tracker_url = "https://matomo-example.localcrag.cloud/"
    instance_settings.matomo_site_id = 1
    instance_settings.gym_mode = False
    db.session.add(instance_settings)

    topoImage = TopoImage()
    topoImage.area_id = Area.get_id_by_slug("dritter-block-von-links")
    topoImage.file_id = File.query.filter_by(original_filename="Love it or leave it.JPG").first().id
    topoImage.created_by_id = adminId
    topoImage.order_index = 0
    db.session.add(topoImage)

    topoImage = TopoImage()
    topoImage.area_id = Area.get_id_by_slug("dritter-block-von-links")
    topoImage.file_id = File.query.filter_by(original_filename="Hate it or love it.JPG").first().id
    topoImage.created_by_id = adminId
    topoImage.order_index = 1
    db.session.add(topoImage)

    linePath = LinePath()
    linePath.line_id = Line.get_id_by_slug("super-spreader")
    linePath.topo_image_id = TopoImage.query.filter_by(order_index=0).first().id
    linePath.path = [
        63.0,
        65.32448061683445,
        45.857142857142854,
        43.90661811951168,
        39.57142857142858,
        26.665238809166848,
        39.714285714285715,
        16.170486185478687,
    ]
    linePath.created_by_id = adminId
    linePath.order_index = 0
    linePath.order_index_for_line = 0
    db.session.add(linePath)

    linePath = LinePath()
    linePath.line_id = Line.get_id_by_slug("treppe")
    linePath.topo_image_id = TopoImage.query.filter_by(order_index=0).first().id
    linePath.path = [
        84.42857142857143,
        70.25058899121868,
        75.85714285714286,
        35.767830370529026,
        68.71428571428571,
        8.781323623902335,
    ]
    linePath.created_by_id = adminId
    linePath.order_index = 1
    linePath.order_index_for_line = 0
    db.session.add(linePath)

    linePath = LinePath()
    linePath.line_id = Line.get_id_by_slug("super-spreader")
    linePath.topo_image_id = TopoImage.query.filter_by(order_index=1).first().id
    linePath.path = [
        57.71428571428571,
        59.04761904761905,
        57.57142857142858,
        39.23809523809524,
        45.714285714285715,
        27.42857142857143,
        38.714285714285715,
        15.42857142857143,
        41.14285714285714,
        2.4761904761904763,
    ]
    linePath.created_by_id = adminId
    linePath.order_index = 1
    linePath.order_index_for_line = 1
    db.session.add(linePath)

    mapMarker = MapMarker()
    mapMarker.lat = 34.343434
    mapMarker.lng = 29.292929
    mapMarker.type = MapMarkerType.AREA
    mapMarker.area_id = Area.get_id_by_slug("dritter-block-von-links")
    db.session.add(mapMarker)

    menuPage = MenuPage()
    menuPage.title = "Impressum"
    menuPage.text = "<p>Hier steht ein Impressums Text.</p>"
    menuPage.created_by_id = adminId
    db.session.add(menuPage)

    menuPage = MenuPage()
    menuPage.title = "Datenschutzerklärung"
    menuPage.text = "<p>Hier steht die Datenschutzerklärung.</p>"
    menuPage.created_by_id = adminId
    db.session.add(menuPage)

    menuItem = MenuItem()
    menuItem.type = MenuItemTypeEnum.MENU_PAGE
    menuItem.position = MenuItemPositionEnum.BOTTOM
    menuItem.order_index = 0
    menuItem.menu_page_id = menuPage.get_id_by_slug("impressum")
    menuItem.created_by_id = adminId
    db.session.add(menuItem)

    menuItem = MenuItem()
    menuItem.type = MenuItemTypeEnum.MENU_PAGE
    menuItem.position = MenuItemPositionEnum.BOTTOM
    menuItem.order_index = 1
    menuItem.menu_page_id = menuPage.get_id_by_slug("datenschutzerklaerung")
    menuItem.created_by_id = adminId
    db.session.add(menuItem)

    menuItem = MenuItem()
    menuItem.type = MenuItemTypeEnum.TOPO
    menuItem.position = MenuItemPositionEnum.TOP
    menuItem.order_index = 1
    menuItem.created_by_id = adminId
    db.session.add(menuItem)

    menuItem = MenuItem()
    menuItem.type = MenuItemTypeEnum.YOUTUBE
    menuItem.position = MenuItemPositionEnum.TOP
    menuItem.order_index = 2
    menuItem.created_by_id = adminId
    db.session.add(menuItem)

    menuItem = MenuItem()
    menuItem.type = MenuItemTypeEnum.INSTAGRAM
    menuItem.position = MenuItemPositionEnum.TOP
    menuItem.order_index = 3
    menuItem.created_by_id = adminId
    db.session.add(menuItem)

    menuItem = MenuItem()
    menuItem.type = MenuItemTypeEnum.NEWS
    menuItem.position = MenuItemPositionEnum.TOP
    menuItem.order_index = 0
    menuItem.created_by_id = adminId
    db.session.add(menuItem)

    for secret in [None, True]:
        ranking = Ranking()
        ranking.user_id = adminId
        ranking.top_10 = 22
        ranking.top_50 = 22
        ranking.type = LineTypeEnum.BOULDER
        ranking.top_values = [22]
        ranking.total_count = 1
        ranking.secret = secret
        db.session.add(ranking)

        ranking = Ranking()
        ranking.user_id = adminId
        ranking.sector_id = Sector.get_id_by_slug("schattental")
        ranking.top_10 = 22
        ranking.top_50 = 22
        ranking.type = LineTypeEnum.BOULDER
        ranking.top_values = [22]
        ranking.total_count = 1
        ranking.secret = secret
        db.session.add(ranking)

        ranking = Ranking()
        ranking.user_id = adminId
        ranking.crag_id = Crag.get_id_by_slug("brione")
        ranking.top_10 = 22
        ranking.top_50 = 22
        ranking.type = LineTypeEnum.BOULDER
        ranking.top_values = [22]
        ranking.total_count = 1
        ranking.secret = secret
        db.session.add(ranking)

    for jti in [
        "00bd7a15-fdb4-4986-b9d5-78f3edd461fc",
        "a256938c-cf46-4288-a40b-5bb7305cb61e",
        "5f2edb37-1fb3-4e10-99cb-66a67fd80d71",
        "cd5c8e72-e115-4195-84eb-fd8b65559662",
        "7d291e44-016a-4869-91af-3416d2060c9c",
        "f5bd3862-78ba-471a-b0e5-fa55d419e435",
    ]:
        revokedToken = RevokedToken()
        revokedToken.jti = jti
        db.session.add(revokedToken)

    db.session.commit()
