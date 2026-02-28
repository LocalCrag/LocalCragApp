from extensions import db
from models.crag import Crag
from models.enums.fa_default_format_enum import FaDefaultFormatEnum
from models.enums.starting_position_enum import StartingPositionEnum
from models.file import File
from models.instance_settings import InstanceSettings
from models.sector import Sector


def test_successful_get_instance_settings(client):
    instance_settings = InstanceSettings.return_it()

    rv = client.get("/api/instance-settings")
    assert rv.status_code == 200
    res = rv.json
    assert res["instanceName"] == instance_settings.instance_name
    assert res["copyrightOwner"] == instance_settings.copyright_owner
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
    assert res["maxFileSize"] == 5
    assert res["maxImageSize"] == 4
    assert res["gymMode"] == instance_settings.gym_mode
    assert res["skippedHierarchicalLayers"] == instance_settings.skipped_hierarchical_layers
    assert res["displayUserGrades"] == instance_settings.display_user_grades
    assert res["displayUserRatings"] == instance_settings.display_user_ratings
    assert res["faDefaultFormat"] == instance_settings.fa_default_format.value
    assert res["defaultStartingPosition"] == instance_settings.default_starting_position.value
    assert res["rankingPastWeeks"] == instance_settings.ranking_past_weeks
    assert res["disableFAInAscents"] == instance_settings.disable_fa_in_ascents


def test_successful_edit_instance_settings(client, moderator_token):
    instance_settings = InstanceSettings.return_it()
    any_file_id = str(File.query.first().id)
    post_data = {
        "instanceName": "Gleesbouldering",
        "copyrightOwner": "Die Gleesards e.V.",
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
        "displayUserGrades": True,
        "displayUserRatings": True,
        # Can only change the value with a "clean" database
        "skippedHierarchicalLayers": instance_settings.skipped_hierarchical_layers,
        "faDefaultFormat": FaDefaultFormatEnum.DATE.value,
        "defaultStartingPosition": StartingPositionEnum.SIT.value,
        "rankingPastWeeks": 12,
        "disableFAInAscents": True,
        "language": "de",
    }
    rv = client.put("/api/instance-settings", token=moderator_token, json=post_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["instanceName"] == "Gleesbouldering"
    assert res["copyrightOwner"] == "Die Gleesards e.V."
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
    assert res["maxFileSize"] == 5
    assert res["maxImageSize"] == 4
    assert res["gymMode"] is True
    assert res["skippedHierarchicalLayers"] == instance_settings.skipped_hierarchical_layers
    assert res["displayUserRatings"] is True
    assert res["displayUserGrades"] is True
    assert res["faDefaultFormat"] == FaDefaultFormatEnum.DATE.value
    assert res["defaultStartingPosition"] == StartingPositionEnum.SIT.value
    assert res["rankingPastWeeks"] == 12
    assert res["disableFAInAscents"] is True
    assert res["language"] == "de"


def test_successful_change_skipped_hierarchical_layers(client, moderator_token):
    # Clean database
    crags = Crag.query.all()
    for crag in crags:
        db.session.delete(crag)

    any_file_id = str(File.query.first().id)
    post_data = {
        "instanceName": "Gleesbouldering",
        "copyrightOwner": "Die Gleesards e.V.",
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
        "displayUserRatings": True,
        "displayUserGrades": True,
        # Can only change the value with a "clean" database
        "skippedHierarchicalLayers": 2,
        "faDefaultFormat": FaDefaultFormatEnum.DATE.value,
        "defaultStartingPosition": StartingPositionEnum.STAND.value,
        "rankingPastWeeks": None,
        "disableFAInAscents": False,
        "language": "en",
    }
    rv = client.put("/api/instance-settings", token=moderator_token, json=post_data)
    assert rv.status_code == 200

    crag = Crag.find_by_slug("_default")
    assert crag is not None

    sector = Sector.find_by_slug("_default")
    assert sector is not None


def test_error_conflict_skipped_hierarchical_layers(client, moderator_token):
    any_file_id = str(File.query.first().id)
    post_data = {
        "instanceName": "Gleesbouldering",
        "copyrightOwner": "Die Gleesards e.V.",
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
        "displayUserRatings": True,
        "displayUserGrades": True,
        "skippedHierarchicalLayers": 2,
        "faDefaultFormat": FaDefaultFormatEnum.DATE.value,
        "defaultStartingPosition": StartingPositionEnum.STAND.value,
        "rankingPastWeeks": 4,
        "disableFAInAscents": True,
        "language": "en",
    }
    rv = client.put("/api/instance-settings", token=moderator_token, json=post_data)
    assert rv.status_code == 409, rv.json
