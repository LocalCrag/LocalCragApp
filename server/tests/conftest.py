import os
import shutil
import subprocess
from pathlib import Path

import boto3
import botocore
import moto
import pytest
from flask import current_app

from app import app


@pytest.fixture
def client():
    # Load dump
    with app.app_context():
        subprocess.check_output(
            "export PGPASSWORD={}; pg_restore --no-privileges --no-owner -h {} -p {} -U {} -d {} --format=c --clean -j 4 ../tests/dumps/localcrag_test_dump.sql".format(
                current_app.config['TEST_POSTGRES_PASSWORD'],
                current_app.config['TEST_POSTGRES_HOST'],
                current_app.config['TEST_POSTGRES_PORT'],
                current_app.config['TEST_POSTGRES_ROLE'],
                current_app.config['TEST_POSTGRES_DBNAME'],
            ), shell=True)

    # Return client
    return app.test_client()


@pytest.fixture
def s3_mock():
    with app.app_context():
        mock = moto.mock_aws()
        try:
            mock.start()
            # conn = boto3.resource('s3', region_name=app.config['SPACES_REGION'])
            # conn.create_bucket(Bucket=app.config['SPACES_BUCKET'],
            #                    CreateBucketConfiguration={"LocationConstraint": app.config['SPACES_REGION']})

            session = boto3.session.Session()
            client = session.client('s3',
                                    endpoint_url=current_app.config['SPACES_ENDPOINT'],
                                    config=botocore.config.Config(s3={'addressing_style': 'virtual'}),
                                    region_name=current_app.config['SPACES_REGION'],
                                    aws_access_key_id=current_app.config['SPACES_ACCESS_KEY'],
                                    aws_secret_access_key=current_app.config['SPACES_SECRET_KEY'])
            client.create_bucket(Bucket=app.config['SPACES_BUCKET'],
                               CreateBucketConfiguration={"LocationConstraint": app.config['SPACES_REGION']})

            # with TargetFileSystem() as target_fs:
            #     copy_assets(test_fs, target_fs)
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
