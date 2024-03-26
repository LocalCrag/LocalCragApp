import json

from tests.utils.user_test_util import get_login_headers


def test_successful_get_instance_settings(client):
    rv = client.get('/api/instance-settings')
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['instanceName'] == "My LocalCrag"
    assert res['copyrightOwner'] == "Your name goes here"
    assert res['youtubeUrl'] == None
    assert res['instagramUrl'] == None
    assert res['logoImage'] == None
    assert res['faviconImage'] == None
    assert res['mainBgImage'] == None
    assert res['authBgImage'] == None
    assert res['arrowColor'] == '#FFE016'
    assert res['arrowTextColor'] == '#000000'
    assert res['arrowHighlightColor'] == '#FF0000'
    assert res['arrowHighlightTextColor'] == '#FFFFFF'


def test_successful_edit_instance_settings(client):
    access_headers, refresh_headers = get_login_headers(client)
    post_data = {
        "instanceName": "Gleesbouldering",
        "copyrightOwner": "Die Gleesards e.V.",
        "youtubeUrl": "https://youtube.com",
        "instagramUrl": "https://instagram.com",
        "logoImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
        "faviconImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
        "mainBgImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
        "authBgImage": '6137f55a-6201-45ab-89c5-6e9c29739d61',
        "arrowColor": '#AAAAAA',
        "arrowTextColor": '#BBBBBB',
        "arrowHighlightColor": '#CCCCCC',
        "arrowHighlightTextColor": '#DDDDDD',
    }
    rv = client.put('/api/instance-settings', headers=access_headers, json=post_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['instanceName'] == "Gleesbouldering"
    assert res['copyrightOwner'] == "Die Gleesards e.V."
    assert res['youtubeUrl'] == "https://youtube.com"
    assert res['instagramUrl'] == "https://instagram.com"
    assert res['logoImage']['id'] == '6137f55a-6201-45ab-89c5-6e9c29739d61'
    assert res['faviconImage']['id'] == '6137f55a-6201-45ab-89c5-6e9c29739d61'
    assert res['mainBgImage']['id'] == '6137f55a-6201-45ab-89c5-6e9c29739d61'
    assert res['authBgImage']['id'] == '6137f55a-6201-45ab-89c5-6e9c29739d61'
    assert res['arrowColor'] == '#AAAAAA'
    assert res['arrowTextColor'] == '#BBBBBB'
    assert res['arrowHighlightColor'] == '#CCCCCC'
    assert res['arrowHighlightTextColor'] == '#DDDDDD'
