from flask import current_app, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.instance_settings_schema import instance_settings_schema
from models.instance_settings import InstanceSettings
from util.security_util import check_auth_claims
from webargs_schemas.instance_settings_args import instance_settings_args


def add_fixed_instance_settings(payload):
    """
    Adds non-editable settings to the instance settings response.
    """
    payload["maxFileSize"] = current_app.config["MAX_FILE_SIZE"]
    payload["maxImageSize"] = current_app.config["MAX_IMAGE_SIZE"]
    return payload


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

        instance_settings.instance_name = instance_settings_data["instanceName"]
        instance_settings.copyright_owner = instance_settings_data["copyrightOwner"]
        instance_settings.youtube_url = instance_settings_data["youtubeUrl"]
        instance_settings.instagram_url = instance_settings_data["instagramUrl"]
        instance_settings.logo_image_id = instance_settings_data["logoImage"]
        instance_settings.favicon_image_id = instance_settings_data["faviconImage"]
        instance_settings.auth_bg_image_id = instance_settings_data["authBgImage"]
        instance_settings.main_bg_image_id = instance_settings_data["mainBgImage"]
        instance_settings.arrow_color = instance_settings_data["arrowColor"]
        instance_settings.arrow_text_color = instance_settings_data["arrowTextColor"]
        instance_settings.arrow_highlight_color = instance_settings_data["arrowHighlightColor"]
        instance_settings.arrow_highlight_text_color = instance_settings_data["arrowHighlightTextColor"]
        instance_settings.bar_chart_color = instance_settings_data["barChartColor"]
        instance_settings.matomo_tracker_url = instance_settings_data["matomoTrackerUrl"]
        instance_settings.matomo_site_id = instance_settings_data["matomoSiteId"]
        instance_settings.maptiler_api_key = instance_settings_data["maptilerApiKey"]
        db.session.add(instance_settings)
        db.session.commit()

        instance_settings_response = instance_settings_schema.dump(instance_settings)
        instance_settings_response = add_fixed_instance_settings(instance_settings_response)
        return instance_settings_response, 200
