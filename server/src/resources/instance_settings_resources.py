from flask import request
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.conflict import Conflict
from extensions import db
from marshmallow_schemas.instance_settings_schema import instance_settings_schema
from messages.messages import ResponseMessage
from models.crag import Crag
from models.instance_settings import InstanceSettings
from models.sector import Sector
from util.security_util import check_auth_claims
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
        instance_settings.gym_mode = instance_settings_data["gymMode"]

        if instance_settings_data["skippedHierarchicalLayers"] > instance_settings.skipped_hierarchical_layers:
            if instance_settings_data["skippedHierarchicalLayers"] >= 1:
                if Crag.query.filter(Crag.slug != "_default").count() > 0:
                    raise Conflict(ResponseMessage.MIGRATION_IMPOSSIBLE.value)
                if Crag.query.filter(Crag.slug == "_default").count() == 0:
                    crag = Crag()
                    crag.name = "_default"
                    crag.slug = "_default"
                    db.session.add(crag)

            if instance_settings_data["skippedHierarchicalLayers"] >= 2:
                if Sector.query.filter(Sector.slug != "_default").count() > 0:
                    raise Conflict(ResponseMessage.MIGRATION_IMPOSSIBLE.value)
                if Sector.query.filter(Sector.slug == "_default").count() == 0:
                    sector = Sector()
                    sector.name = "_default"
                    sector.slug = "_default"
                    sector.crag_id = Crag.get_id_by_slug("_default")
                    db.session.add(sector)

        elif instance_settings_data["skippedHierarchicalLayers"] < instance_settings.skipped_hierarchical_layers:
            if instance_settings_data["skippedHierarchicalLayers"] <= 1:
                sector = Sector.find_by_slug("_default")
                sector.name = "ToBeRenamed"
                sector.slug = "toberenamed"
                db.session.add(sector)

            if instance_settings_data["skippedHierarchicalLayers"] == 0:
                crag = Crag.find_by_slug("_default")
                crag.name = "ToBeRenamed"
                crag.slug = "toberenamed"
                db.session.add(crag)

        instance_settings.skipped_hierarchical_layers = instance_settings_data["skippedHierarchicalLayers"]

        db.session.add(instance_settings)
        db.session.commit()

        return instance_settings_schema.dump(instance_settings), 200
