from copy import deepcopy

from flask import current_app, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.conflict import Conflict
from extensions import db
from marshmallow_schemas.instance_settings_schema import instance_settings_schema
from messages.messages import ResponseMessage
from models.crag import Crag
from models.instance_settings import InstanceSettings
from models.region import Region
from models.sector import Sector
from scheduler_jobs.closure_materialization import (
    reschedule_closure_materialization_job,
)
from util.scheduled_closure import request_closure_materialization
from util.security_util import check_auth_claims
from webargs_schemas.instance_settings_args import (
    instance_settings_args,
    instance_settings_schema_cls,
)


def add_fixed_instance_settings(payload):
    """
    Adds non-editable settings to the instance settings response.
    """
    payload["maxFileSize"] = current_app.config["MAX_FILE_SIZE"]
    payload["maxImageSize"] = current_app.config["MAX_IMAGE_SIZE"]
    payload["sentryEnabled"] = current_app.config["SENTRY_ENABLED"]
    payload["sentryDsn"] = current_app.config["SENTRY_DSN"]
    return payload


def instance_settings_request_payload(instance_settings: InstanceSettings) -> dict:
    return {
        "instanceName": instance_settings.instance_name,
        "copyrightOwner": instance_settings.copyright_owner,
        "mailGreeting": instance_settings.mail_greeting,
        "logoImage": str(instance_settings.logo_image_id) if instance_settings.logo_image_id else None,
        "darkLogoImage": str(instance_settings.dark_logo_image_id) if instance_settings.dark_logo_image_id else None,
        "faviconImage": str(instance_settings.favicon_image_id) if instance_settings.favicon_image_id else None,
        "bgImage": str(instance_settings.bg_image_id) if instance_settings.bg_image_id else None,
        "arrowColor": instance_settings.arrow_color,
        "arrowTextColor": instance_settings.arrow_text_color,
        "arrowHighlightColor": instance_settings.arrow_highlight_color,
        "arrowHighlightTextColor": instance_settings.arrow_highlight_text_color,
        "barChartColor": instance_settings.bar_chart_color,
        "barChartAccentColor": instance_settings.bar_chart_accent_color,
        "darkBarChartColor": instance_settings.dark_bar_chart_color,
        "darkBarChartAccentColor": instance_settings.dark_bar_chart_accent_color,
        "language": instance_settings.language,
        "matomoTrackerUrl": instance_settings.matomo_tracker_url,
        "matomoSiteId": instance_settings.matomo_site_id,
        "mapBaseLayers": deepcopy(instance_settings.map_base_layers or []),
        "mapOverlays": deepcopy(instance_settings.map_overlays or []),
        "gymMode": instance_settings.gym_mode,
        "skippedHierarchicalLayers": instance_settings.skipped_hierarchical_layers,
        "displayUserGrades": instance_settings.display_user_grades,
        "displayUserRatings": instance_settings.display_user_ratings,
        "faDefaultFormat": instance_settings.fa_default_format.value,
        "defaultStartingPosition": instance_settings.default_starting_position.value,
        "rankingPastWeeks": instance_settings.ranking_past_weeks,
        "timezone": instance_settings.timezone,
    }


def merge_instance_settings_patch(current_payload: dict, patch_payload: dict) -> dict:
    merged = deepcopy(current_payload)
    for key, value in patch_payload.items():
        merged[key] = deepcopy(value)
    return merged


def apply_instance_settings_data(instance_settings: InstanceSettings, instance_settings_data: dict) -> None:
    instance_settings.instance_name = instance_settings_data["instanceName"]
    instance_settings.copyright_owner = instance_settings_data["copyrightOwner"]
    instance_settings.mail_greeting = instance_settings_data["mailGreeting"]
    instance_settings.logo_image_id = instance_settings_data["logoImage"]
    instance_settings.dark_logo_image_id = instance_settings_data["darkLogoImage"]
    instance_settings.favicon_image_id = instance_settings_data["faviconImage"]
    instance_settings.bg_image_id = instance_settings_data["bgImage"]
    instance_settings.arrow_color = instance_settings_data["arrowColor"]
    instance_settings.arrow_text_color = instance_settings_data["arrowTextColor"]
    instance_settings.arrow_highlight_color = instance_settings_data["arrowHighlightColor"]
    instance_settings.arrow_highlight_text_color = instance_settings_data["arrowHighlightTextColor"]
    instance_settings.bar_chart_color = instance_settings_data["barChartColor"]
    instance_settings.bar_chart_accent_color = instance_settings_data["barChartAccentColor"]
    instance_settings.dark_bar_chart_color = instance_settings_data["darkBarChartColor"]
    instance_settings.dark_bar_chart_accent_color = instance_settings_data["darkBarChartAccentColor"]
    instance_settings.language = instance_settings_data["language"]
    instance_settings.matomo_tracker_url = instance_settings_data["matomoTrackerUrl"]
    instance_settings.matomo_site_id = instance_settings_data["matomoSiteId"]
    instance_settings.map_base_layers = list(instance_settings_data["mapBaseLayers"])
    instance_settings.map_overlays = list(instance_settings_data["mapOverlays"])
    instance_settings.gym_mode = instance_settings_data["gymMode"]
    instance_settings.display_user_grades = instance_settings_data["displayUserGrades"]
    instance_settings.display_user_ratings = instance_settings_data["displayUserRatings"]
    instance_settings.fa_default_format = instance_settings_data["faDefaultFormat"]
    instance_settings.default_starting_position = instance_settings_data["defaultStartingPosition"]
    instance_settings.ranking_past_weeks = instance_settings_data["rankingPastWeeks"]
    instance_settings.timezone = instance_settings_data["timezone"]


def apply_skipped_hierarchical_layers(instance_settings: InstanceSettings, next_value: int) -> None:
    if next_value > instance_settings.skipped_hierarchical_layers:
        if next_value >= 1:
            if Crag.query.filter(Crag.slug != "_default").count() > 0:
                raise Conflict(ResponseMessage.MIGRATION_IMPOSSIBLE.value)
            if Crag.query.filter(Crag.slug == "_default").count() == 0:
                region = Region.return_it()
                crag = Crag()
                crag.name = region.name
                crag.slug = "_default"
                db.session.add(crag)

        if next_value >= 2:
            if Sector.query.filter(Sector.slug != "_default").count() > 0:
                raise Conflict(ResponseMessage.MIGRATION_IMPOSSIBLE.value)
            if Sector.query.filter(Sector.slug == "_default").count() == 0:
                region = Region.return_it()
                sector = Sector()
                sector.name = region.name
                sector.slug = "_default"
                sector.crag_id = Crag.get_id_by_slug("_default")
                db.session.add(sector)

    elif next_value < instance_settings.skipped_hierarchical_layers:
        if next_value <= 1:
            sector = Sector.find_by_slug("_default")
            sector.name = "ToBeRenamed"
            sector.slug = "toberenamed"
            db.session.add(sector)

        if next_value == 0:
            crag = Crag.find_by_slug("_default")
            crag.name = "ToBeRenamed"
            crag.slug = "toberenamed"
            db.session.add(crag)

    instance_settings.skipped_hierarchical_layers = next_value


def update_instance_settings_from_payload(instance_settings: InstanceSettings, instance_settings_data: dict):
    previous_timezone = instance_settings.timezone
    apply_instance_settings_data(instance_settings, instance_settings_data)
    apply_skipped_hierarchical_layers(
        instance_settings,
        instance_settings_data["skippedHierarchicalLayers"],
    )
    db.session.add(instance_settings)
    db.session.commit()

    if previous_timezone != instance_settings.timezone:
        reschedule_closure_materialization_job(current_app._get_current_object())
        request_closure_materialization()


class GetInstanceSettings(MethodView):
    def get(self):
        instance_settings: InstanceSettings = InstanceSettings.return_it()
        instance_settings_response = instance_settings_schema.dump(instance_settings)
        instance_settings_response = add_fixed_instance_settings(instance_settings_response)
        return instance_settings_response, 200


class UpdateInstanceSettings(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self):
        instance_settings_data = parser.parse(instance_settings_args, request)
        instance_settings: InstanceSettings = InstanceSettings.return_it()
        update_instance_settings_from_payload(instance_settings, instance_settings_data)

        instance_settings_response = instance_settings_schema.dump(instance_settings)
        instance_settings_response = add_fixed_instance_settings(instance_settings_response)
        return instance_settings_response, 200

    @jwt_required()
    @check_auth_claims(moderator=True)
    def patch(self):
        patch_payload = request.get_json(silent=True) or {}
        patch_payload = instance_settings_schema_cls().load(patch_payload, partial=True)
        instance_settings: InstanceSettings = InstanceSettings.return_it()
        merged_payload = merge_instance_settings_patch(
            instance_settings_request_payload(instance_settings),
            patch_payload,
        )
        instance_settings_data = instance_settings_schema_cls().load(merged_payload)
        update_instance_settings_from_payload(instance_settings, instance_settings_data)

        instance_settings_response = instance_settings_schema.dump(instance_settings)
        instance_settings_response = add_fixed_instance_settings(instance_settings_response)
        return instance_settings_response, 200
