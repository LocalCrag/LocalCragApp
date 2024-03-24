import json

from tests.utils.user_test_util import get_login_headers


def test_successful_create_menu_page(client):
    access_headers, refresh_headers = get_login_headers(client)
    menu_page_data = {
        "title": "Glees ist gesperrt!",
        "text": "<p>Haha, verarscht!</p>",
    }

    rv = client.post('/api/menu-pages', headers=access_headers, json=menu_page_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['title'] == "Glees ist gesperrt!"
    assert res['slug'] == "glees-ist-gesperrt"
    assert res['text'] == "<p>Haha, verarscht!</p>"
    assert res['id'] is not None


def test_successful_get_menu_pages(client):
    rv = client.get('/api/menu-pages')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 2
    assert res[1]['id'] == "6b9cef8c-397c-4b1c-8141-4005ada1758c"
    assert res[1]['slug'] == "impressum"
    assert res[1]['title'] == "Impressum"
    assert res[1]['text'] == "<p>Hier steht ein Impressums Text.</p>"
    assert res[0]['id'] == "f2b0606f-46f6-4012-be67-5315bba154d2"
    assert res[0]['slug'] == "datenschutzerklaerung"
    assert res[0]['title'] == "Datenschutzerklärung"
    assert res[0]['text'] == "<p>Hier steht die Datenschutzerklärung.</p>"


def test_successful_get_menu_page(client):
    rv = client.get('/api/menu-pages/impressum')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['id'] == "6b9cef8c-397c-4b1c-8141-4005ada1758c"
    assert res['slug'] == "impressum"
    assert res['title'] == "Impressum"
    assert res['text'] == "<p>Hier steht ein Impressums Text.</p>"


def test_get_deleted_menu_page(client):
    rv = client.get('/api/menu-pages/hohenfels')
    assert rv.status_code == 404
    res = json.loads(rv.data)
    assert res['message'] == "ENTITY_NOT_FOUND"


def test_successful_delete_menu_page(client):
    access_headers, refresh_headers = get_login_headers(client)

    rv = client.delete('/api/menu-pages/impressum', headers=access_headers)
    assert rv.status_code == 204


def test_successful_edit_menu_page(client):
    access_headers, refresh_headers = get_login_headers(client)
    menu_page_data = {
        "title": "Alles außer Eifel",
        "text": "ist soft bewertet",
    }

    rv = client.put('/api/menu-pages/impressum', headers=access_headers, json=menu_page_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['slug'] == "alles-ausser-eifel"
    assert res['title'] == "Alles außer Eifel"
    assert res['text'] == "ist soft bewertet"
    assert res['id'] is not None

