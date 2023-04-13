import os
import shutil
import subprocess
from pathlib import Path

import pytest

from app import app


@pytest.fixture
def client():
    # Load dump
    subprocess.check_output('psql localcrag_test < ../tests/dumps/localcrag_test_dump.sql', shell=True)

    # Return client
    return app.test_client()


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
