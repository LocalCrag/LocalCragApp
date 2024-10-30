import validators
from marshmallow import validate
from webargs import fields

instance_settings_args = {
    "instanceName": fields.Str(required=True, validate=validate.Length(max=120)),
    "copyrightOwner": fields.Str(required=True, validate=validate.Length(max=120)),
    "gymMode": fields.Boolean(required=True),
    "youtubeUrl": fields.Str(
        required=True, allow_none=True, validate=lambda x: validators.url(x) is True and validate.Length(max=120)
    ),
    "instagramUrl": fields.Str(
        required=True, allow_none=True, validate=lambda x: validators.url(x) is True and validate.Length(max=120)
    ),
    "logoImage": fields.String(required=True, allow_none=True),
    "faviconImage": fields.String(required=True, allow_none=True),
    "authBgImage": fields.String(required=True, allow_none=True),
    "mainBgImage": fields.String(required=True, allow_none=True),
    "arrowColor": fields.Str(required=True),
    "arrowTextColor": fields.Str(required=True),
    "arrowHighlightColor": fields.Str(required=True),
    "arrowHighlightTextColor": fields.Str(required=True),
    "barChartColor": fields.Str(required=True),
    "matomoTrackerUrl": fields.Str(required=True, allow_none=True),
    "matomoSiteId": fields.Str(required=True, allow_none=True),
    "maptilerApiKey": fields.Str(required=True, allow_none=True),
    "skippedHierarchicalLayers": fields.Integer(required=True, validate=validate.Range(min=0, min_inclusive=True)),
}
