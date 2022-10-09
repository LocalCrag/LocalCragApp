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
    upload_data = {
        'qquuid': 'test-uuid',
        'qqfilename': 'test_pdf.pdf',
        'qqtotalfilesize': 1234,
        'qqfile': upload_file
    }
    rv = client.post('/api/upload', headers=access_headers, data=upload_data, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['filename'] == 'test-uuid.pdf'
    assert res['originalFilename'] == 'test_pdf.pdf'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert os.path.isfile('uploads/test-uuid.pdf') is True
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
    upload_data = {
        'qquuid': 'test-uuid',
        'qqfilename': 'test_image_large_filesize.jpg',
        'qqtotalfilesize': 5940312,
        'qqfile': upload_image
    }
    rv = client.post('/api/upload', headers=access_headers, data=upload_data, content_type='multipart/form-data')
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
    upload_data = {
        'qquuid': 'test-uuid',
        'qqfilename': 'test_image_271_186.jpeg',
        'qqtotalfilesize': 6353,
        'qqfile': upload_image
    }
    rv = client.post('/api/upload', headers=access_headers, data=upload_data, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 186
    assert res['width'] == 271
    assert res['filename'] == 'test-uuid.jpeg'
    assert res['originalFilename'] == 'test_image_271_186.jpeg'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is False
    assert res['thumbnailL'] is False
    assert res['thumbnailXL'] is False
    assert os.path.isfile('uploads/test-uuid.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_xs.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_s.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_m.jpeg') is False
    assert os.path.isfile('uploads/test-uuid_l.jpeg') is False
    assert os.path.isfile('uploads/test-uuid_xl.jpeg') is False


def test_successful_upload_medium(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_512_512.jpg"), "rb"),
        filename="test_image_512_512.jpg",
        content_type="image/jpg",
    ),
    upload_data = {
        'qquuid': 'test-uuid',
        'qqfilename': 'test_image_512_512.jpg',
        'qqtotalfilesize': 29034,
        'qqfile': upload_image
    }
    rv = client.post('/api/upload', headers=access_headers, data=upload_data, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 512
    assert res['width'] == 512
    assert res['filename'] == 'test-uuid.jpeg'
    assert res['originalFilename'] == 'test_image_512_512.jpg'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is True
    assert res['thumbnailL'] is False
    assert res['thumbnailXL'] is False
    assert os.path.isfile('uploads/test-uuid.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_xs.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_s.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_m.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_l.jpeg') is False
    assert os.path.isfile('uploads/test-uuid_xl.jpeg') is False


def test_successful_upload_large(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_4000_2667.jpg"), "rb"),
        filename="test_image_4000_2667.jpg",
        content_type="image/jpeg",
    ),
    upload_data = {
        'qquuid': 'test-uuid',
        'qqfilename': 'test_image_4000_2667.jpg',
        'qqtotalfilesize': 1328939,
        'qqfile': upload_image
    }
    rv = client.post('/api/upload', headers=access_headers, data=upload_data, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 2667
    assert res['width'] == 4000
    assert res['filename'] == 'test-uuid.jpeg'
    assert res['originalFilename'] == 'test_image_4000_2667.jpg'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is True
    assert res['thumbnailL'] is True
    assert res['thumbnailXL'] is True
    assert os.path.isfile('uploads/test-uuid.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_xs.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_s.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_m.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_l.jpeg') is True
    assert os.path.isfile('uploads/test-uuid_xl.jpeg') is True


def test_upload_too_large_file(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_large_filesize.jpg"), "rb"),
        filename="test_image_large_filesize.jpg",
        content_type="image/jpg",
    ),
    upload_data = {
        'qquuid': 'test-uuid',
        'qqfilename': 'test_image_large_filesize.jpg',
        'qqtotalfilesize': 5940312,
        'qqfile': upload_image
    }
    rv = client.post('/api/upload', headers=access_headers, data=upload_data, content_type='multipart/form-data')
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == 'FILESIZE_LIMIT_EXCEEDED'
    assert os.path.isfile('uploads/test-uuid.jpg') is False
    assert os.path.isfile('uploads/test-uuid_xs.jpg') is False
    assert os.path.isfile('uploads/test-uuid_s.jpg') is False
    assert os.path.isfile('uploads/test-uuid_m.jpg') is False
    assert os.path.isfile('uploads/test-uuid_l.jpg') is False
    assert os.path.isfile('uploads/test-uuid_xl.jpg') is False


def test_successful_upload_small_png(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_271_186.png"), "rb"),
        filename="test_image_271_186.png",
        content_type="image/png",
    ),
    upload_data = {
        'qquuid': 'test-uuid',
        'qqfilename': 'test_image_271_186.png',
        'qqtotalfilesize': 6353,
        'qqfile': upload_image
    }
    rv = client.post('/api/upload', headers=access_headers, data=upload_data, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 186
    assert res['width'] == 271
    assert res['filename'] == 'test-uuid.png'
    assert res['originalFilename'] == 'test_image_271_186.png'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is False
    assert res['thumbnailL'] is False
    assert res['thumbnailXL'] is False
    assert os.path.isfile('uploads/test-uuid.png') is True
    assert os.path.isfile('uploads/test-uuid_xs.png') is True
    assert os.path.isfile('uploads/test-uuid_s.png') is True
    assert os.path.isfile('uploads/test-uuid_m.png') is False
    assert os.path.isfile('uploads/test-uuid_l.png') is False
    assert os.path.isfile('uploads/test-uuid_xl.png') is False


def test_successful_upload_small_gif(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_271_186.gif"), "rb"),
        filename="test_image_271_186.gif",
        content_type="image/gif",
    ),
    upload_data = {
        'qquuid': 'test-uuid',
        'qqfilename': 'test_image_271_186.gif',
        'qqtotalfilesize': 6353,
        'qqfile': upload_image
    }
    rv = client.post('/api/upload', headers=access_headers, data=upload_data, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 186
    assert res['width'] == 271
    assert res['filename'] == 'test-uuid.gif'
    assert res['originalFilename'] == 'test_image_271_186.gif'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is False
    assert res['thumbnailL'] is False
    assert res['thumbnailXL'] is False
    assert os.path.isfile('uploads/test-uuid.gif') is True
    assert os.path.isfile('uploads/test-uuid_xs.gif') is True
    assert os.path.isfile('uploads/test-uuid_s.gif') is True
    assert os.path.isfile('uploads/test-uuid_m.gif') is False
    assert os.path.isfile('uploads/test-uuid_l.gif') is False
    assert os.path.isfile('uploads/test-uuid_xl.gif') is False


def test_successful_upload_small_bmp(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client)
    upload_image = FileStorage(
        stream=open(os.path.join("../tests/assets/test_image_271_186.bmp"), "rb"),
        filename="test_image_271_186.bmp",
        content_type="image/bmp",
    ),
    upload_data = {
        'qquuid': 'test-uuid',
        'qqfilename': 'test_image_271_186.bmp',
        'qqtotalfilesize': 6353,
        'qqfile': upload_image
    }
    rv = client.post('/api/upload', headers=access_headers, data=upload_data, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['height'] == 186
    assert res['width'] == 271
    assert res['filename'] == 'test-uuid.bmp'
    assert res['originalFilename'] == 'test_image_271_186.bmp'
    assert isinstance(res['id'], str)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert res['thumbnailXS'] is True
    assert res['thumbnailS'] is True
    assert res['thumbnailM'] is False
    assert res['thumbnailL'] is False
    assert res['thumbnailXL'] is False
    assert os.path.isfile('uploads/test-uuid.bmp') is True
    assert os.path.isfile('uploads/test-uuid_xs.bmp') is True
    assert os.path.isfile('uploads/test-uuid_s.bmp') is True
    assert os.path.isfile('uploads/test-uuid_m.bmp') is False
    assert os.path.isfile('uploads/test-uuid_l.bmp') is False
    assert os.path.isfile('uploads/test-uuid_xl.bmp') is False
