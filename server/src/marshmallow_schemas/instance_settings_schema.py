from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class InstanceSettingsSchema(ma.SQLAlchemySchema):
    timeUpdated = fields.DateTime(attribute="time_updated")
    instanceName = fields.String(attribute="instance_name")
    copyrightOwner = fields.String(attribute="copyright_owner")
    youtubeUrl = fields.String(attribute="youtube_url")
    instagramUrl = fields.String(attribute="instagram_url")
    logoImage = fields.Nested(file_schema, attribute='logo_image')
    faviconImage = fields.Nested(file_schema, attribute='favicon_image')
    authBgImage = fields.Nested(file_schema, attribute='auth_bg_image')
    mainBgImage = fields.Nested(file_schema, attribute='main_bg_image')
    arrowColor = fields.String(attribute="arrow_color")
    arrowTextColor = fields.String(attribute="arrow_text_color")
    arrowHighlightColor = fields.String(attribute="arrow_highlight_color")
    arrowHighlightTextColor = fields.String(attribute="arrow_highlight_text_color")



instance_settings_schema = InstanceSettingsSchema()
