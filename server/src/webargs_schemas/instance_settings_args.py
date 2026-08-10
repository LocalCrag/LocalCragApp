from marshmallow import ValidationError, validate
from webargs import fields

from models.enums.fa_default_format_enum import FaDefaultFormatEnum
from models.enums.starting_position_enum import StartingPositionEnum
from util.instance_timezone import validate_timezone
from util.validators import color_validator, validate_language


def _validate_map_layer_url(url: str) -> None:
    if not (url.startswith("http://") or url.startswith("https://")):
        raise ValidationError("url must start with http:// or https://")


def _validate_map_layer_item(item: dict) -> None:
    url = item.get("url") or ""
    _validate_map_layer_url(url)
    if item.get("sourceKind") == "tiles":
        if "{z}" not in url or "{x}" not in url or "{y}" not in url:
            raise ValidationError("tiles url must contain {z}, {x}, and {y} placeholders")


_rock_explorer_map_layer_item = {
    "id": fields.Str(required=True, validate=validate.Length(min=1, max=64)),
    "name": fields.Str(required=True, validate=validate.Length(min=1, max=120)),
    "sourceKind": fields.Str(required=True, validate=validate.OneOf(["tilejson", "tiles"])),
    "url": fields.Str(required=True, validate=validate.Length(max=2048)),
    "type": fields.Str(required=True, validate=validate.OneOf(["raster"])),
    "opacity": fields.Float(required=True, validate=validate.Range(min=0, max=1)),
    "tileSize": fields.Integer(load_default=256, validate=validate.OneOf([256, 512])),
    "defaultOn": fields.Bool(load_default=True),
}


instance_settings_args = {
    "instanceName": fields.Str(required=True, validate=validate.Length(max=120)),
    "copyrightOwner": fields.Str(required=True, validate=validate.Length(max=120)),
    "mailGreeting": fields.Str(required=True, validate=validate.Length(max=120)),
    "gymMode": fields.Boolean(required=True),
    "logoImage": fields.String(required=True, allow_none=True),
    "darkLogoImage": fields.String(required=True, allow_none=True),
    "faviconImage": fields.String(required=True, allow_none=True),
    "bgImage": fields.String(required=True, allow_none=True),
    "arrowColor": fields.Str(required=True, validate=color_validator),
    "arrowTextColor": fields.Str(required=True, validate=color_validator),
    "arrowHighlightColor": fields.Str(required=True, validate=color_validator),
    "arrowHighlightTextColor": fields.Str(required=True, validate=color_validator),
    "barChartColor": fields.Str(required=True, validate=validate.Length(max=30)),
    "barChartAccentColor": fields.Str(required=True, validate=validate.Length(max=30)),
    "darkBarChartColor": fields.Str(required=True, validate=validate.Length(max=30)),
    "darkBarChartAccentColor": fields.Str(required=True, validate=validate.Length(max=30)),
    "language": fields.Str(required=True, validate=validate_language),
    "matomoTrackerUrl": fields.Str(required=True, allow_none=True, validate=validate.Length(max=120)),
    "matomoSiteId": fields.Str(required=True, allow_none=True, validate=validate.Length(max=120)),
    "maptilerApiKey": fields.Str(required=True, allow_none=True, validate=validate.Length(max=120)),
    "rockExplorerMapLayers": fields.List(
        fields.Nested(_rock_explorer_map_layer_item, validate=_validate_map_layer_item),
        required=True,
        validate=validate.Length(max=10),
    ),
    "skippedHierarchicalLayers": fields.Integer(
        required=True, validate=validate.Range(min=0, max=2, min_inclusive=True, max_inclusive=True)
    ),
    "displayUserGrades": fields.Boolean(required=True),
    "displayUserRatings": fields.Boolean(required=True),
    "faDefaultFormat": fields.Enum(FaDefaultFormatEnum, required=True, allow_none=False),
    "defaultStartingPosition": fields.Enum(StartingPositionEnum, required=True, allow_none=False),
    "rankingPastWeeks": fields.Integer(
        required=True,
        allow_none=True,
        validate=validate.Range(min=1, max=20, min_inclusive=True, max_inclusive=True),
    ),
    "timezone": fields.Str(required=True, validate=validate_timezone),
}
