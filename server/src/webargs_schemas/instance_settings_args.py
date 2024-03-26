import validators
from webargs import fields

instance_settings_args = {
    "instanceName": fields.Str(required=True),
    "copyrightOwner": fields.Str(required=True),
    "youtubeUrl": fields.Str(required=True, allow_none=True, validate=lambda x: validators.url(x) == True),
    "instagramUrl": fields.Str(required=True, allow_none=True, validate=lambda x: validators.url(x) == True),
    "logoImage": fields.String(required=True, allow_none=True),
    "faviconImage": fields.String(required=True, allow_none=True),
    "authBgImage": fields.String(required=True, allow_none=True),
    "mainBgImage": fields.String(required=True, allow_none=True),
    "arrowColor": fields.Str(required=True),
    "arrowTextColor": fields.Str(required=True),
    "arrowHighlightColor": fields.Str(required=True),
    "arrowHighlightTextColor": fields.Str(required=True),
}
