from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from marshmallow_schemas.file_schema import file_schema
from models.enums.starting_position_enum import StartingPositionEnum


class InstanceSettingsSchema(ma.SQLAlchemySchema):
    timeUpdated = fields.DateTime(attribute="time_updated")
    instanceName = fields.String(attribute="instance_name")
    copyrightOwner = fields.String(attribute="copyright_owner")
    logoImage = fields.Nested(file_schema, attribute="logo_image")
    faviconImage = fields.Nested(file_schema, attribute="favicon_image")
    authBgImage = fields.Nested(file_schema, attribute="auth_bg_image")
    mainBgImage = fields.Nested(file_schema, attribute="main_bg_image")
    arrowColor = fields.String(attribute="arrow_color")
    arrowTextColor = fields.String(attribute="arrow_text_color")
    arrowHighlightColor = fields.String(attribute="arrow_highlight_color")
    arrowHighlightTextColor = fields.String(attribute="arrow_highlight_text_color")
    barChartColor = fields.String(attribute="bar_chart_color")
    matomoTrackerUrl = fields.String(attribute="matomo_tracker_url")
    matomoSiteId = fields.String(attribute="matomo_site_id")
    maptilerApiKey = fields.String(attribute="maptiler_api_key")
    gymMode = fields.Boolean(attribute="gym_mode")
    skippedHierarchicalLayers = fields.Integer(attribute="skipped_hierarchical_layers")
    displayUserGrades = fields.Boolean(attribute="display_user_grades")
    displayUserRatings = fields.Boolean(attribute="display_user_ratings")
    faDefaultFormat = fields.String(attribute="fa_default_format")
    defaultStartingPosition = EnumField(StartingPositionEnum, by_value=True, attribute="default_starting_position")
    rankingPastWeeks = fields.Integer(attribute="ranking_past_weeks", allow_none=True)


instance_settings_schema = InstanceSettingsSchema()
