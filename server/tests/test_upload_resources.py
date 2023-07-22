import json
import os

from werkzeug.datastructures import FileStorage

from tests.utils.user_test_util import get_login_headers


def test_successful_file_upload(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_file = FileStorage(
        stream=open(os.path.join("../tests/assets/test_pdf.pdf"), "rb"),
        filename="test_pdf.pdf",
        content_type="	application/pdf",
    ),
    rv = client.post('/api/upload', headers=access_headers, data={'upload':upload_file}, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert type(res['filename']) == str
    assert res['originalFilename'] == 'test_pdf.pdf'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert os.path.isfile('uploads/{}'.format(res['filename'])) is True
    assert res['width'] is None
    assert res['height'] is None
    assert res['thumbnailXS'] is None
    assert res['thumbnailS'] is None
    assert res['thumbnailM'] is None
    assert res['thumbnailL'] is None
    assert res['thumbnailXL'] is None


def test_file_upload_too_large_file(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_large_filesize.jpg"), "rb"),
        filename="test_image_large_filesize.jpg",
        content_type="image/jpg",
    ),
    rv = client.post('/api/upload', headers=access_headers, data={'upload':upload_image}, content_type='multipart/form-data')
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == 'FILESIZE_LIMIT_EXCEEDED'
    assert os.path.isfile('uploads/test-uuid.jpg') is False


def test_successful_upload_small(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_271_186.jpeg"), "rb"),
        filename="test_image_271_186.jpeg",
        content_type="image/jpg",
    ),
    rv = client.post('/api/upload', headers=access_headers, data={'upload':upload_image}, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 186
    assert res['width'] == 271
    assert type(res['filename']) == str
    assert res['originalFilename'] == 'test_image_271_186.jpeg'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is False
    assert res['thumbnailL'] is False
    assert res['thumbnailXL'] is False
    filename_parts = res['filename'].split('.')
    assert os.path.isfile('uploads/{}'.format(res['filename'])) is True
    assert os.path.isfile('uploads/{}_xs.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_s.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_m.{}'.format(filename_parts[0], filename_parts[1])) is False
    assert os.path.isfile('uploads/{}_l.{}'.format(filename_parts[0], filename_parts[1])) is False
    assert os.path.isfile('uploads/{}_xl.{}'.format(filename_parts[0], filename_parts[1])) is False



def test_successful_upload_medium(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_512_512.jpg"), "rb"),
        filename="test_image_512_512.jpg",
        content_type="image/jpg",
    ),
    rv = client.post('/api/upload', headers=access_headers, data={'upload':upload_image}, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 512
    assert res['width'] == 512
    assert type(res['filename']) == str
    assert res['originalFilename'] == 'test_image_512_512.jpg'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is True
    assert res['thumbnailL'] is False
    assert res['thumbnailXL'] is False
    filename_parts = res['filename'].split('.')
    assert os.path.isfile('uploads/{}'.format(res['filename'])) is True
    assert os.path.isfile('uploads/{}_xs.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_s.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_m.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_l.{}'.format(filename_parts[0], filename_parts[1])) is False
    assert os.path.isfile('uploads/{}_xl.{}'.format(filename_parts[0], filename_parts[1])) is False


def test_successful_upload_large(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_4000_2667.jpg"), "rb"),
        filename="test_image_4000_2667.jpg",
        content_type="image/jpeg",
    ),
    rv = client.post('/api/upload', headers=access_headers, data={'upload':upload_image}, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 2667
    assert res['width'] == 4000
    assert type(res['filename']) == str
    assert res['originalFilename'] == 'test_image_4000_2667.jpg'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is True
    assert res['thumbnailL'] is True
    assert res['thumbnailXL'] is True
    filename_parts = res['filename'].split('.')
    assert os.path.isfile('uploads/{}'.format(res['filename'])) is True
    assert os.path.isfile('uploads/{}_xs.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_s.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_m.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_l.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_xl.{}'.format(filename_parts[0], filename_parts[1])) is True


def test_upload_too_large_file(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_large_filesize.jpg"), "rb"),
        filename="test_image_large_filesize.jpg",
        content_type="image/jpg",
    ),
    rv = client.post('/api/upload', headers=access_headers, data={'upload':upload_image}, content_type='multipart/form-data')
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == 'FILESIZE_LIMIT_EXCEEDED'



def test_successful_upload_small_png(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_271_186.png"), "rb"),
        filename="test_image_271_186.png",
        content_type="image/png",
    ),
    rv = client.post('/api/upload', headers=access_headers, data={'upload':upload_image}, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 186
    assert res['width'] == 271
    assert type(res['filename']) == str
    assert res['originalFilename'] == 'test_image_271_186.png'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is False
    assert res['thumbnailL'] is False
    assert res['thumbnailXL'] is False
    filename_parts = res['filename'].split('.')
    assert os.path.isfile('uploads/{}'.format(res['filename'])) is True
    assert os.path.isfile('uploads/{}_xs.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_s.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_m.{}'.format(filename_parts[0], filename_parts[1])) is False
    assert os.path.isfile('uploads/{}_l.{}'.format(filename_parts[0], filename_parts[1])) is False
    assert os.path.isfile('uploads/{}_xl.{}'.format(filename_parts[0], filename_parts[1])) is False


def test_successful_upload_small_gif(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_271_186.gif"), "rb"),
        filename="test_image_271_186.gif",
        content_type="image/gif",
    ),
    rv = client.post('/api/upload', headers=access_headers, data={'upload':upload_image}, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 186
    assert res['width'] == 271
    assert type(res['filename']) == str
    assert res['originalFilename'] == 'test_image_271_186.gif'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is False
    assert res['thumbnailL'] is False
    assert res['thumbnailXL'] is False
    filename_parts = res['filename'].split('.')
    assert os.path.isfile('uploads/{}'.format(res['filename'])) is True
    assert os.path.isfile('uploads/{}_xs.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_s.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_m.{}'.format(filename_parts[0], filename_parts[1])) is False
    assert os.path.isfile('uploads/{}_l.{}'.format(filename_parts[0], filename_parts[1])) is False
    assert os.path.isfile('uploads/{}_xl.{}'.format(filename_parts[0], filename_parts[1])) is False


def test_successful_upload_small_bmp(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_271_186.bmp"), "rb"),
        filename="test_image_271_186.bmp",
        content_type="image/bmp",
    ),
    rv = client.post('/api/upload', headers=access_headers, data={'upload':upload_image}, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 186
    assert res['width'] == 271
    assert type(res['filename']) == str
    assert res['originalFilename'] == 'test_image_271_186.bmp'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is False
    assert res['thumbnailL'] is False
    assert res['thumbnailXL'] is False
    filename_parts = res['filename'].split('.')
    assert os.path.isfile('uploads/{}'.format(res['filename'])) is True
    assert os.path.isfile('uploads/{}_xs.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_s.{}'.format(filename_parts[0], filename_parts[1])) is True
    assert os.path.isfile('uploads/{}_m.{}'.format(filename_parts[0], filename_parts[1])) is False
    assert os.path.isfile('uploads/{}_l.{}'.format(filename_parts[0], filename_parts[1])) is False
    assert os.path.isfile('uploads/{}_xl.{}'.format(filename_parts[0], filename_parts[1])) is False
