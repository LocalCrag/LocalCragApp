from models.file import File
from models.instance_settings import InstanceSettings


def test_successful_get_instance_settings(client):
    instance_settings = InstanceSettings.return_it()

    rv = client.get("/api/instance-settings")
    assert rv.status_code == 200
    res = rv.json
    assert res["instanceName"] == instance_settings.instance_name
    assert res["copyrightOwner"] == instance_settings.copyright_owner
    assert res["youtubeUrl"] == instance_settings.youtube_url
    assert res["instagramUrl"] == instance_settings.instagram_url
    assert res["logoImage"] is None or res["logoImage"] == str(instance_settings.logo_image_id)
    assert res["faviconImage"] is None or res["faviconImage"] == str(instance_settings.favicon_image_id)
    assert res["mainBgImage"] is None or res["mainBgImage"] == str(instance_settings.main_bg_image_id)
    assert res["authBgImage"] is None or res["authBgImage"] == str(instance_settings.auth_bg_image_id)
    assert res["arrowColor"] == instance_settings.arrow_color
    assert res["arrowTextColor"] == instance_settings.arrow_text_color
    assert res["arrowHighlightColor"] == instance_settings.arrow_highlight_color
    assert res["arrowHighlightTextColor"] == instance_settings.arrow_highlight_text_color
    assert res["barChartColor"] == instance_settings.bar_chart_color
    assert res["matomoTrackerUrl"] == instance_settings.matomo_tracker_url
    assert res["matomoSiteId"] == instance_settings.matomo_site_id
    assert res["maptilerApiKey"] == instance_settings.maptiler_api_key
    assert res["gymMode"] == instance_settings.gym_mode


def test_successful_edit_instance_settings(client, moderator_token):
    instance_settings = InstanceSettings.return_it()
    any_file_id = str(File.query.first().id)
    post_data = {
        "instanceName": "Gleesbouldering",
        "copyrightOwner": "Die Gleesards e.V.",
        "youtubeUrl": "https://youtube.com",
        "instagramUrl": "https://instagram.com",
        "logoImage": any_file_id,
        "faviconImage": any_file_id,
        "mainBgImage": any_file_id,
        "authBgImage": any_file_id,
        "arrowColor": "#AAAAAA",
        "arrowTextColor": "#BBBBBB",
        "arrowHighlightColor": "#CCCCCC",
        "arrowHighlightTextColor": "#DDDDDD",
        "barChartColor": "rgb(213, 30, 39)",
        "matomoTrackerUrl": "https://matomo-example-2.localcrag.cloud",
        "matomoSiteId": "2",
        "maptilerApiKey": "maptiler",
        "gymMode": True,
    }
    rv = client.put("/api/instance-settings", token=moderator_token, json=post_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["instanceName"] == "Gleesbouldering"
    assert res["copyrightOwner"] == "Die Gleesards e.V."
    assert res["youtubeUrl"] == "https://youtube.com"
    assert res["instagramUrl"] == "https://instagram.com"
    assert res["logoImage"]["id"] == any_file_id
    assert res["faviconImage"]["id"] == any_file_id
    assert res["mainBgImage"]["id"] == any_file_id
    assert res["authBgImage"]["id"] == any_file_id
    assert res["arrowColor"] == "#AAAAAA"
    assert res["arrowTextColor"] == "#BBBBBB"
    assert res["arrowHighlightColor"] == "#CCCCCC"
    assert res["arrowHighlightTextColor"] == "#DDDDDD"
    assert res["barChartColor"] == "rgb(213, 30, 39)"
    assert res["matomoTrackerUrl"] == "https://matomo-example-2.localcrag.cloud"
    assert res["matomoSiteId"] == "2"
    assert res["maptilerApiKey"] == "maptiler"
    assert res["gymMode"] == True
