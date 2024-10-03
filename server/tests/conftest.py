import os
import shutil
from datetime import timedelta

import boto3
import botocore
import moto
import pytest
from flask import current_app
from flask_jwt_extended import create_access_token
from sqlalchemy import URL, create_engine, text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.orm import scoped_session, sessionmaker

from app import app
from extensions import db
from models.area import Area
from models.ascent import Ascent
from models.crag import Crag
from models.enums.line_type_enum import LineTypeEnum
from models.enums.starting_position_enum import StartingPositionEnum
from models.line import Line
from models.region import Region
from models.sector import Sector
from models.user import User


@pytest.fixture(scope='session', autouse=True)
def setup_db():
    with app.app_context():
        try:
            # To create the database if not exists, we need to remove it from the URL
            main_url = db.engine.url
            engine = create_engine(
                URL.create(main_url.drivername, main_url.username, main_url.password, main_url.host, main_url.port, "postgres", main_url.query))
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
    connection = db.engine.connect()
    transaction = connection.begin()
    db.session = scoped_session(sessionmaker(bind=connection, autoflush=False))
    yield db.session
    transaction.rollback()
    connection.close()
    db.session.remove()


@pytest.fixture
def client():
    return app.test_client()


@pytest.fixture(scope='session')
def admin_token():
    return create_access_token(identity="admin@localcrag.invalid.org",
                               additional_claims={"admin": True, "moderator": True, "member": True},
                               expires_delta=timedelta(days=1))


@pytest.fixture(scope='session')
def moderator_token():
    return create_access_token(identity="moderator@localcrag.invalid.org",
                               additional_claims={"admin": False, "moderator": True, "member": True},
                               expires_delta=timedelta(days=1))


@pytest.fixture(scope='session')
def member_token():
    return create_access_token(identity="member@localcrag.invalid.org",
                               additional_claims={"admin": False, "moderator": False, "member": True},
                               expires_delta=timedelta(days=1))


@pytest.fixture
def s3_mock():
    with app.app_context():
        mock = moto.mock_aws()
        try:
            mock.start()
            session = boto3.session.Session()
            client = session.client('s3',
                                    endpoint_url=current_app.config['SPACES_ENDPOINT'],
                                    config=botocore.config.Config(s3={'addressing_style': current_app.config['SPACES_ADDRESSING']}),
                                    region_name=current_app.config['SPACES_REGION'],
                                    aws_access_key_id=current_app.config['SPACES_ACCESS_KEY'],
                                    aws_secret_access_key=current_app.config['SPACES_SECRET_KEY'])
            client.create_bucket(Bucket=app.config['SPACES_BUCKET'],
                                 CreateBucketConfiguration={"LocationConstraint": app.config['SPACES_REGION']})
            yield client
        finally:
            mock.stop()


def remove_upload_test_files():
    extensions = ['jpg', 'jpeg', 'png', 'bmp', 'gif', 'pdf']
    for extension in extensions:
        if os.path.exists('uploads/test-uuid.{}'.format(extension)):
            os.remove('uploads/test-uuid.{}'.format(extension))
        if os.path.exists('uploads/test-uuid_xs.{}'.format(extension)):
            os.remove('uploads/test-uuid_xs.{}'.format(extension))
        if os.path.exists('uploads/test-uuid_s.{}'.format(extension)):
            os.remove('uploads/test-uuid_s.{}'.format(extension))
        if os.path.exists('uploads/test-uuid_m.{}'.format(extension)):
            os.remove('uploads/test-uuid_m.{}'.format(extension))
        if os.path.exists('uploads/test-uuid_l.{}'.format(extension)):
            os.remove('uploads/test-uuid_l.{}'.format(extension))
        if os.path.exists('uploads/test-uuid_xl.{}'.format(extension)):
            os.remove('uploads/test-uuid_xl.{}'.format(extension))


def copy_required_upload_files():
    """
    Copies all images that need to physically exist for the tests (not just in the DB but as file).
    """
    if not os.path.isdir('uploads'):
        os.makedirs('uploads')

    # Reaction formular image for PDF generator test
    shutil.copyfile(
        '../tests/assets/test_image_271_186.png',
        'uploads/6bbf1ddf-81d0-4229-825c-efb7633eb837.png'
    )
    # Files used as analysis PDF
    shutil.copyfile(
        '../tests/assets/test_pdf.pdf',
        'uploads/vx-200-manual.pdf'
    )
    shutil.copyfile(
        '../tests/assets/test_pdf.pdf',
        'uploads/vx-200-manual-2.pdf'
    )


@pytest.fixture
def clean_test_uploads():
    remove_upload_test_files()


@pytest.fixture(scope='session', autouse=True)
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
    db.session.add(crag)

    sector = Sector()
    sector.name = "Schattental"
    sector.description = "<p>Lange Beschreibung zum Schattental</p>"
    sector.short_description = "Kurze Beschreibung zum Schattental"
    sector.crag_id = Crag.get_id_by_slug("brione")
    db.session.add(sector)

    sector = Sector()
    sector.name = "Oben"
    sector.description = ""
    sector.short_description = ""
    sector.crag_id = Crag.get_id_by_slug("brione")
    db.session.add(sector)

    area = Area()
    area.name = "Dritter Block von links"
    area.description = "<p>Allgemeine Infos zum dritten Block von links.</p>"
    area.sector_id = Sector.get_id_by_slug("schattental")
    db.session.add(area)

    area = Area()
    area.name = "Noch ein Bereich"
    area.description = ""
    area.sector_id = Sector.get_id_by_slug("schattental")
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
    ascent.created_by_id = User.find_by_email("admin@localcrag.invalid.org").id
    ascent.with_kneepad = True
    ascent.line_id = Line.get_id_by_slug("super-spreader")
    ascent.area_id = Area.get_id_by_slug("dritter-block-von-links")
    ascent.sector_id = Sector.get_id_by_slug("schattental")
    ascent.crag_id = Crag.get_id_by_slug("brione")
    db.session.add(ascent)

    db.session.commit()
