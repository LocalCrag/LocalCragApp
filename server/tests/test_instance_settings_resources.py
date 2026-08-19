from extensions import db
from models.crag import Crag
from models.enums.fa_default_format_enum import FaDefaultFormatEnum
from models.enums.starting_position_enum import StartingPositionEnum
from models.instance_settings import InstanceSettings
from models.sector import Sector


def _base_post_data(instance_settings=None, **overrides):
    if instance_settings is None:
        instance_settings = InstanceSettings.return_it()
    post_data = {
        "instanceName": "Gleesbouldering",
        "copyrightOwner": "Die Gleesards e.V.",
        "mailGreeting": "Best regards",
        "logoImage": None,
        "darkLogoImage": None,
        "faviconImage": None,
        "bgImage": None,
        "arrowColor": "#AAAAAA",
        "arrowTextColor": "#BBBBBB",
        "arrowHighlightColor": "#CCCCCC",
        "arrowHighlightTextColor": "#DDDDDD",
        "barChartColor": "rgb(213, 30, 39)",
        "barChartAccentColor": "rgb(250, 204, 21)",
        "darkBarChartColor": "rgb(248, 113, 113)",
        "darkBarChartAccentColor": "rgb(253, 224, 71)",
        "matomoTrackerUrl": "https://matomo-example-2.localcrag.cloud",
        "matomoSiteId": "2",
        "mapBaseLayers": [],
        "mapOverlays": [],
        "gymMode": True,
        "displayUserGrades": True,
        "displayUserRatings": True,
        "skippedHierarchicalLayers": instance_settings.skipped_hierarchical_layers,
        "faDefaultFormat": FaDefaultFormatEnum.DATE.value,
        "defaultStartingPosition": StartingPositionEnum.SIT.value,
        "rankingPastWeeks": 12,
        "language": "de",
        "timezone": "Europe/Berlin",
    }
    post_data.update(overrides)
    return post_data


def test_successful_get_instance_settings(client):
    instance_settings = InstanceSettings.return_it()

    rv = client.get("/api/instance-settings")
    assert rv.status_code == 200
    res = rv.json
    assert res["instanceName"] == instance_settings.instance_name
    assert res["copyrightOwner"] == instance_settings.copyright_owner
    assert res["mailGreeting"] == instance_settings.mail_greeting
    assert res["logoImage"] is None or res["logoImage"] == str(instance_settings.logo_image_id)
    assert res["faviconImage"] is None or res["faviconImage"] == str(instance_settings.favicon_image_id)
    assert res["bgImage"] is None or res["bgImage"] == str(instance_settings.bg_image_id)
    assert res["arrowColor"] == instance_settings.arrow_color
    assert res["arrowTextColor"] == instance_settings.arrow_text_color
    assert res["arrowHighlightColor"] == instance_settings.arrow_highlight_color
    assert res["arrowHighlightTextColor"] == instance_settings.arrow_highlight_text_color
    assert res["barChartColor"] == instance_settings.bar_chart_color
    assert res["barChartAccentColor"] == instance_settings.bar_chart_accent_color
    assert res["darkBarChartColor"] == instance_settings.dark_bar_chart_color
    assert res["darkBarChartAccentColor"] == instance_settings.dark_bar_chart_accent_color
    assert res["matomoTrackerUrl"] == instance_settings.matomo_tracker_url
    assert res["matomoSiteId"] == instance_settings.matomo_site_id
    assert res["mapBaseLayers"] == []
    assert res["mapOverlays"] == []
    assert res["maxFileSize"] == 5
    assert res["maxImageSize"] == 4
    assert res["sentryEnabled"] is False
    assert res["sentryDsn"] == ""
    assert res["gymMode"] == instance_settings.gym_mode
    assert res["skippedHierarchicalLayers"] == instance_settings.skipped_hierarchical_layers
    assert res["displayUserGrades"] == instance_settings.display_user_grades
    assert res["displayUserRatings"] == instance_settings.display_user_ratings
    assert res["faDefaultFormat"] == instance_settings.fa_default_format.value
    assert res["defaultStartingPosition"] == instance_settings.default_starting_position.value
    assert res["rankingPastWeeks"] == instance_settings.ranking_past_weeks
    assert res["timezone"] == instance_settings.timezone


def test_successful_patch_instance_settings(client, moderator_token, any_file):
    instance_settings = InstanceSettings.return_it()
    patch_data = {
        "logoImage": str(any_file.id),
        "faviconImage": str(any_file.id),
        "bgImage": str(any_file.id),
        "mailGreeting": "Best regards",
    }
    rv = client.patch("/api/instance-settings", token=moderator_token, json=patch_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["instanceName"] == "Gleesbouldering"
    assert res["copyrightOwner"] == "Die Gleesards e.V."
    assert res["mailGreeting"] == "Best regards"
    assert res["logoImage"]["id"] == str(any_file.id)
    assert res["faviconImage"]["id"] == str(any_file.id)
    assert res["bgImage"]["id"] == str(any_file.id)
    assert res["arrowColor"] == "#AAAAAA"
    assert res["arrowTextColor"] == "#BBBBBB"
    assert res["arrowHighlightColor"] == "#CCCCCC"
    assert res["arrowHighlightTextColor"] == "#DDDDDD"
    assert res["barChartColor"] == "rgb(213, 30, 39)"
    assert res["barChartAccentColor"] == "rgb(250, 204, 21)"
    assert res["darkBarChartColor"] == "rgb(248, 113, 113)"
    assert res["darkBarChartAccentColor"] == "rgb(253, 224, 71)"
    assert res["matomoTrackerUrl"] == "https://matomo-example-2.localcrag.cloud"
    assert res["matomoSiteId"] == "2"
    assert res["mapBaseLayers"] == []
    assert res["mapOverlays"] == []
    assert res["maxFileSize"] == 5
    assert res["maxImageSize"] == 4
    assert res["sentryEnabled"] is False
    assert res["sentryDsn"] == ""
    assert res["gymMode"] is True
    assert res["skippedHierarchicalLayers"] == instance_settings.skipped_hierarchical_layers
    assert res["displayUserRatings"] is True
    assert res["displayUserGrades"] is True
    assert res["faDefaultFormat"] == FaDefaultFormatEnum.DATE.value
    assert res["defaultStartingPosition"] == StartingPositionEnum.SIT.value
    assert res["rankingPastWeeks"] == 12
    assert res["language"] == "de"
    assert res["timezone"] == "Europe/Berlin"


def test_successful_patch_nullable_instance_settings_fields(client, moderator_token, any_file):
    post_data = _base_post_data(
        logoImage=str(any_file.id),
        darkLogoImage=str(any_file.id),
        faviconImage=str(any_file.id),
        bgImage=str(any_file.id),
        matomoTrackerUrl="https://matomo.localcrag.example",
        matomoSiteId="42",
        rankingPastWeeks=8,
    )
    rv = client.put("/api/instance-settings", token=moderator_token, json=post_data)
    assert rv.status_code == 200, rv.json

    rv = client.patch(
        "/api/instance-settings",
        token=moderator_token,
        json={
            "darkLogoImage": None,
            "bgImage": None,
            "matomoTrackerUrl": None,
            "matomoSiteId": None,
            "rankingPastWeeks": None,
        },
    )
    assert rv.status_code == 200, rv.json
    assert rv.json["darkLogoImage"] is None
    assert rv.json["bgImage"] is None
    assert rv.json["matomoTrackerUrl"] is None
    assert rv.json["matomoSiteId"] is None
    assert rv.json["rankingPastWeeks"] is None


def test_successful_patch_map_overlays(client, moderator_token, any_file):
    layers = [
        {
            "id": "dgm-hillshade",
            "name": "DGM Hillshade",
            "sourceKind": "tilejson",
            "url": "https://tiles.example.org/dgm/tiles.json",
            "type": "raster",
            "opacity": 0.45,
            "tileSize": 256,
            "layers": [],
        },
        {
            "id": "xyz-overlay",
            "name": "XYZ Overlay",
            "sourceKind": "tiles",
            "url": "https://tiles.example.org/{z}/{x}/{y}.png",
            "type": "raster",
            "opacity": 0.5,
            "tileSize": 512,
            "layers": [],
        },
        {
            "id": "naturschutz",
            "name": "Naturschutzgebiete",
            "sourceKind": "tiles",
            "url": "https://tiles.example.org/ns/{z}/{x}/{y}.pbf",
            "type": "vector",
            "opacity": 0.35,
            "tileSize": 256,
            "layers": [
                {
                    "name": "Naturschutzgebiet",
                    "sourceLayer": "nsg",
                    "paintMode": "solid",
                    "color": "#228B22",
                    "categoricalProperty": "",
                    "categoricalStops": [],
                    "defaultActive": True,
                },
                {
                    "name": "Landschaftsschutzgebiet",
                    "sourceLayer": "lsg",
                    "paintMode": "solid",
                    "color": "#1d3557",
                    "categoricalProperty": "",
                    "categoricalStops": [],
                    "defaultActive": False,
                },
            ],
        },
    ]
    rv = client.patch("/api/instance-settings", token=moderator_token, json={"mapOverlays": layers})
    assert rv.status_code == 200, rv.json
    assert rv.json["mapOverlays"] == layers

    rv = client.get("/api/instance-settings")
    assert rv.status_code == 200
    assert rv.json["mapOverlays"] == layers


def test_patch_map_overlays_preserves_existing_base_layers(client, moderator_token, any_file):
    base_layers = [
        {
            "id": "basemap-col",
            "name": "basemap.de Farbe",
            "styleUrl": "https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json",
            "topoDefault": True,
            "rockExplorerDefault": True,
            "defaultOverlayIds": [],
        }
    ]
    rv = client.put(
        "/api/instance-settings",
        token=moderator_token,
        json=_base_post_data(
            logoImage=str(any_file.id),
            faviconImage=str(any_file.id),
            bgImage=str(any_file.id),
            mapBaseLayers=base_layers,
        ),
    )
    assert rv.status_code == 200, rv.json

    overlays = [
        {
            "id": "dgm-hillshade",
            "name": "DGM Hillshade",
            "sourceKind": "tilejson",
            "url": "https://tiles.example.org/dgm/tiles.json",
            "type": "raster",
            "opacity": 0.45,
            "tileSize": 256,
            "layers": [],
        }
    ]
    rv = client.patch("/api/instance-settings", token=moderator_token, json={"mapOverlays": overlays})
    assert rv.status_code == 200, rv.json
    assert rv.json["mapBaseLayers"] == base_layers
    assert rv.json["mapOverlays"] == overlays


def test_successful_patch_categorical_vector_overlay(client, moderator_token, any_file):
    layers = [
        {
            "id": "guek300",
            "name": "GÜK 300",
            "sourceKind": "tilejson",
            "url": "https://tiles.example.org/data/guek300.json",
            "type": "vector",
            "opacity": 0.4,
            "tileSize": 256,
            "layers": [
                {
                    "name": "Geologie",
                    "sourceLayer": "guek300",
                    "paintMode": "categorical",
                    "color": "#888888",
                    "categoricalProperty": "AERA",
                    "categoricalStops": [
                        {"value": "Känozoikum", "color": "#f4a261"},
                        {"value": "Mesozoikum", "color": "#2a9d8f"},
                    ],
                    "defaultActive": True,
                }
            ],
        }
    ]
    rv = client.patch("/api/instance-settings", token=moderator_token, json={"mapOverlays": layers})
    assert rv.status_code == 200, rv.json
    assert rv.json["mapOverlays"] == layers


def test_reject_categorical_vector_overlay_without_property(client, moderator_token, any_file):
    post_data = _base_post_data(
        logoImage=str(any_file.id),
        faviconImage=str(any_file.id),
        bgImage=str(any_file.id),
        mapOverlays=[
            {
                "id": "guek300",
                "name": "GÜK 300",
                "sourceKind": "tilejson",
                "url": "https://tiles.example.org/data/guek300.json",
                "type": "vector",
                "opacity": 0.4,
                "layers": [
                    {
                        "name": "Geologie",
                        "sourceLayer": "guek300",
                        "paintMode": "categorical",
                        "color": "#888888",
                        "categoricalProperty": "",
                        "categoricalStops": [{"value": "A", "color": "#111111"}],
                        "defaultActive": True,
                    }
                ],
            }
        ],
    )
    rv = client.patch("/api/instance-settings", token=moderator_token, json={"mapOverlays": post_data["mapOverlays"]})
    assert rv.status_code == 400


def test_reject_vector_overlay_without_source_layer(client, moderator_token, any_file):
    post_data = _base_post_data(
        logoImage=str(any_file.id),
        faviconImage=str(any_file.id),
        bgImage=str(any_file.id),
        mapOverlays=[
            {
                "id": "naturschutz",
                "name": "Naturschutzgebiete",
                "sourceKind": "tilejson",
                "url": "https://tiles.example.org/ns/tiles.json",
                "type": "vector",
                "opacity": 0.35,
                "layers": [],
            }
        ],
    )
    rv = client.put("/api/instance-settings", token=moderator_token, json=post_data)
    assert rv.status_code == 400


def test_successful_patch_map_base_layers(client, moderator_token, any_file):
    layers = [
        {
            "id": "basemap-col",
            "name": "basemap.de Farbe",
            "styleUrl": "https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json",
            "topoDefault": True,
            "rockExplorerDefault": True,
            "defaultOverlayIds": ["dgm-hillshade"],
        },
        {
            "id": "maptiler-topo",
            "name": "Topo",
            "styleUrl": "https://api.maptiler.com/maps/topo-v2/style.json?key=abc",
            "topoDefault": False,
            "rockExplorerDefault": False,
            "defaultOverlayIds": [],
        },
    ]
    rv = client.patch("/api/instance-settings", token=moderator_token, json={"mapBaseLayers": layers})
    assert rv.status_code == 200, rv.json
    assert rv.json["mapBaseLayers"] == layers

    rv = client.get("/api/instance-settings")
    assert rv.status_code == 200
    assert rv.json["mapBaseLayers"] == layers


def test_patch_map_base_layers_preserves_existing_overlays(client, moderator_token, any_file):
    overlays = [
        {
            "id": "dgm-hillshade",
            "name": "DGM Hillshade",
            "sourceKind": "tilejson",
            "url": "https://tiles.example.org/dgm/tiles.json",
            "type": "raster",
            "opacity": 0.45,
            "tileSize": 256,
            "layers": [],
        }
    ]
    rv = client.put(
        "/api/instance-settings",
        token=moderator_token,
        json=_base_post_data(
            logoImage=str(any_file.id),
            faviconImage=str(any_file.id),
            bgImage=str(any_file.id),
            mapOverlays=overlays,
        ),
    )
    assert rv.status_code == 200, rv.json

    base_layers = [
        {
            "id": "basemap-col",
            "name": "basemap.de Farbe",
            "styleUrl": "https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json",
            "topoDefault": True,
            "rockExplorerDefault": True,
            "defaultOverlayIds": ["dgm-hillshade"],
        }
    ]
    rv = client.patch("/api/instance-settings", token=moderator_token, json={"mapBaseLayers": base_layers})
    assert rv.status_code == 200, rv.json
    assert rv.json["mapOverlays"] == overlays
    assert rv.json["mapBaseLayers"] == base_layers


def test_reject_map_base_layers_without_topo_default(client, moderator_token, any_file):
    post_data = _base_post_data(
        logoImage=str(any_file.id),
        faviconImage=str(any_file.id),
        bgImage=str(any_file.id),
        mapBaseLayers=[
            {
                "id": "basemap-col",
                "name": "basemap.de Farbe",
                "styleUrl": "https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json",
                "topoDefault": False,
                "rockExplorerDefault": True,
                "defaultOverlayIds": [],
            }
        ],
    )
    rv = client.patch(
        "/api/instance-settings", token=moderator_token, json={"mapBaseLayers": post_data["mapBaseLayers"]}
    )
    assert rv.status_code == 400, rv.json


def test_reject_map_base_layers_without_rock_explorer_default(client, moderator_token, any_file):
    post_data = _base_post_data(
        logoImage=str(any_file.id),
        faviconImage=str(any_file.id),
        bgImage=str(any_file.id),
        mapBaseLayers=[
            {
                "id": "basemap-col",
                "name": "basemap.de Farbe",
                "styleUrl": "https://sgx.geodatenzentrum.de/gdz_basemapde_vektor/styles/bm_web_col.json",
                "topoDefault": True,
                "rockExplorerDefault": False,
                "defaultOverlayIds": [],
            }
        ],
    )
    rv = client.patch(
        "/api/instance-settings", token=moderator_token, json={"mapBaseLayers": post_data["mapBaseLayers"]}
    )
    assert rv.status_code == 400, rv.json


def test_reject_invalid_map_base_layer_url(client, moderator_token, any_file):
    post_data = _base_post_data(
        logoImage=str(any_file.id),
        faviconImage=str(any_file.id),
        bgImage=str(any_file.id),
        mapBaseLayers=[
            {
                "id": "bad",
                "name": "Bad",
                "styleUrl": "ftp://example.org/style.json",
                "topoDefault": True,
                "rockExplorerDefault": True,
                "defaultOverlayIds": [],
            }
        ],
    )
    rv = client.put("/api/instance-settings", token=moderator_token, json=post_data)
    assert rv.status_code == 400, rv.json


def test_reject_invalid_map_overlay_url(client, moderator_token, any_file):
    post_data = _base_post_data(
        logoImage=str(any_file.id),
        faviconImage=str(any_file.id),
        bgImage=str(any_file.id),
        mapOverlays=[
            {
                "id": "bad",
                "name": "Bad",
                "sourceKind": "tilejson",
                "url": "ftp://tiles.example.org/tiles.json",
                "type": "raster",
                "opacity": 0.5,
                "tileSize": 256,
            }
        ],
    )
    rv = client.put("/api/instance-settings", token=moderator_token, json=post_data)
    assert rv.status_code == 400, rv.json


def test_reject_tiles_url_missing_xyz(client, moderator_token, any_file):
    post_data = _base_post_data(
        logoImage=str(any_file.id),
        faviconImage=str(any_file.id),
        bgImage=str(any_file.id),
        mapOverlays=[
            {
                "id": "bad-tiles",
                "name": "Bad Tiles",
                "sourceKind": "tiles",
                "url": "https://tiles.example.org/no-tokens.png",
                "type": "raster",
                "opacity": 0.5,
                "tileSize": 256,
            }
        ],
    )
    rv = client.put("/api/instance-settings", token=moderator_token, json=post_data)
    assert rv.status_code == 400, rv.json


def test_successful_change_skipped_hierarchical_layers(client, moderator_token, any_file):
    # Clean database
    crags = Crag.query.all()
    for crag in crags:
        db.session.delete(crag)

    post_data = _base_post_data(
        logoImage=str(any_file.id),
        faviconImage=str(any_file.id),
        bgImage=str(any_file.id),
        skippedHierarchicalLayers=2,
        defaultStartingPosition=StartingPositionEnum.STAND.value,
        rankingPastWeeks=None,
        language="en",
        timezone="UTC",
    )
    rv = client.put("/api/instance-settings", token=moderator_token, json=post_data)
    assert rv.status_code == 200

    crag = Crag.find_by_slug("_default")
    assert crag is not None

    sector = Sector.find_by_slug("_default")
    assert sector is not None


def test_successful_patch_timezone(client, moderator_token, any_file):
    rv = client.patch(
        "/api/instance-settings",
        token=moderator_token,
        json={"timezone": "UTC"},
    )
    assert rv.status_code == 200, rv.json
    assert rv.json["timezone"] == "UTC"


def test_error_conflict_skipped_hierarchical_layers(client, moderator_token, any_file):
    post_data = _base_post_data(
        logoImage=str(any_file.id),
        faviconImage=str(any_file.id),
        bgImage=str(any_file.id),
        skippedHierarchicalLayers=2,
        defaultStartingPosition=StartingPositionEnum.STAND.value,
        rankingPastWeeks=4,
        language="en",
        timezone="UTC",
    )
    rv = client.put("/api/instance-settings", token=moderator_token, json=post_data)
    assert rv.status_code == 409, rv.json
