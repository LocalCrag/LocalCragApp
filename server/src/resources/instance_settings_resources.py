from flask import jsonify, request, current_app
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.crag_schema import crag_schema, crags_schema
from marshmallow_schemas.instance_settings_schema import instance_settings_schema
from models.area import Area
from models.crag import Crag
from models.instance_settings import InstanceSettings
from models.line import Line
from models.region import Region
from models.sector import Sector
from models.user import User
from util.security_util import check_auth_claims
from util.validators import validate_order_payload
from webargs_schemas.crag_args import crag_args
from webargs_schemas.instance_settings_args import instance_settings_args


class GetInstanceSettings(MethodView):
    def get(self):
        instance_settings: InstanceSettings = InstanceSettings.return_it()
        return instance_settings_schema.dump(instance_settings), 200


class UpdateInstanceSettings(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self):
        instance_settings_data = parser.parse(instance_settings_args, request)
        instance_settings: InstanceSettings = InstanceSettings.return_it()

        instance_settings.instance_name = instance_settings_data['instanceName']
        instance_settings.copyright_owner = instance_settings_data['copyrightOwner']
        instance_settings.youtube_url = instance_settings_data['youtubeUrl']
        instance_settings.instagram_url = instance_settings_data['instagramUrl']
        instance_settings.logo_image_id = instance_settings_data['logoImage']
        instance_settings.favicon_image_id = instance_settings_data['faviconImage']
        instance_settings.auth_bg_image_id = instance_settings_data['authBgImage']
        instance_settings.main_bg_image_id = instance_settings_data['mainBgImage']
        instance_settings.arrow_color = instance_settings_data['arrowColor']
        instance_settings.arrow_text_color = instance_settings_data['arrowTextColor']
        instance_settings.arrow_highlight_color = instance_settings_data['arrowHighlightColor']
        instance_settings.arrow_highlight_text_color = instance_settings_data['arrowHighlightTextColor']
        instance_settings.bar_chart_color = instance_settings_data['barChartColor']
        instance_settings.matomo_tracker_url = instance_settings_data['matomoTrackerUrl']
        instance_settings.matomo_site_id = instance_settings_data['matomoSiteId']
        db.session.add(instance_settings)
        db.session.commit()

        return instance_settings_schema.dump(instance_settings), 200
