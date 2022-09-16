import json
import os

from werkzeug.datastructures import FileStorage

from tests.utils.user_test_util import get_login_headers


def test_successful_upload(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
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
    rv = client.post('/api/upload/file', headers=access_headers, data=upload_data, content_type='multipart/form-data')
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['filename'] == 'test-uuid.pdf'
    assert res['originalFilename'] == 'test_pdf.pdf'
    assert isinstance(res['id'], int)
    assert isinstance(res['timeCreated'], str)
    assert res['timeUpdated'] is None
    assert os.path.isfile('uploads/test-uuid.pdf') is True


def test_upload_too_large_file(client, clean_test_uploads):
    access_headers, refresh_headers = get_login_headers(client, 'felix@fengelmann.de', 'fengelmann')
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
    rv = client.post('/api/upload/file', headers=access_headers, data=upload_data, content_type='multipart/form-data')
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == 'FILESIZE_LIMIT_EXCEEDED'
    assert os.path.isfile('uploads/test-uuid.jpg') is False
