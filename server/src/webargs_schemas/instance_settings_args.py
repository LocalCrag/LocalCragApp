from marshmallow import Schema, ValidationError, validate
from webargs import fields

from models.enums.fa_default_format_enum import FaDefaultFormatEnum
from models.enums.starting_position_enum import StartingPositionEnum
from util.instance_timezone import validate_timezone
from util.validators import color_validator, validate_language


def _validate_map_layer_url(url: str) -> None:
    if not (url.startswith("http://") or url.startswith("https://")):
        raise ValidationError("url must start with http:// or https://")


def _validate_map_overlay_vector_layer(layer: dict) -> None:
    source_layer = (layer.get("sourceLayer") or "").strip()
    if not source_layer:
        raise ValidationError("sourceLayer is required for vector layers")
    color_validator(layer.get("color") or "")
    paint_mode = layer.get("paintMode") or "solid"
    if paint_mode == "categorical":
        property_name = (layer.get("categoricalProperty") or "").strip()
        if not property_name:
            raise ValidationError("categoricalProperty is required for categorical paint")
        stops = layer.get("categoricalStops") or []
        if not stops:
            raise ValidationError("at least one categorical stop is required")
        seen_values = set()
        for stop in stops:
            value = str(stop.get("value") if stop.get("value") is not None else "").strip()
            if not value:
                raise ValidationError("categorical stop value is required")
            if value in seen_values:
                raise ValidationError(f"duplicate categorical stop value '{value}'")
            seen_values.add(value)
            color_validator(stop.get("color") or "")


def _validate_map_layer_item(item: dict) -> None:
    url = item.get("url") or ""
    _validate_map_layer_url(url)
    if item.get("sourceKind") == "tiles":
        if "{z}" not in url or "{x}" not in url or "{y}" not in url:
            raise ValidationError("tiles url must contain {z}, {x}, and {y} placeholders")
    if item.get("type") == "vector":
        layers = item.get("layers") or []
        if not layers:
            raise ValidationError("at least one vector layer is required")
        seen = set()
        for layer in layers:
            source_layer = (layer.get("sourceLayer") or "").strip()
            if source_layer in seen:
                raise ValidationError(f"duplicate sourceLayer '{source_layer}'")
            if source_layer:
                seen.add(source_layer)
            _validate_map_overlay_vector_layer(layer)


def _validate_base_layer_item(item: dict) -> None:
    style_url = item.get("styleUrl") or ""
    _validate_map_layer_url(style_url)


def _validate_base_layers(layers: list) -> None:
    if not layers:
        return
    if not any(bool(item.get("topoDefault")) for item in layers):
        raise ValidationError("at least one base layer must be marked as topo default")
    if not any(bool(item.get("rockExplorerDefault")) for item in layers):
        raise ValidationError("at least one base layer must be marked as rock explorer default")


_map_base_layer_item = {
    "id": fields.Str(required=True, validate=validate.Length(min=1, max=64)),
    "name": fields.Str(required=True, validate=validate.Length(min=1, max=120)),
    "styleUrl": fields.Str(required=True, validate=validate.Length(max=2048)),
    "topoDefault": fields.Bool(load_default=False),
    "rockExplorerDefault": fields.Bool(load_default=False),
    "defaultOverlayIds": fields.List(
        fields.Str(validate=validate.Length(min=1, max=64)),
        load_default=list,
        validate=validate.Length(max=10),
    ),
}


_map_overlay_categorical_stop_item = {
    "value": fields.Str(required=True, validate=validate.Length(min=1, max=500)),
    "color": fields.Str(required=True, validate=validate.Length(max=7)),
}


_map_overlay_vector_layer_item = {
    "name": fields.Str(required=True, validate=validate.Length(min=1, max=120)),
    "sourceLayer": fields.Str(required=True, validate=validate.Length(min=1, max=120)),
    "paintMode": fields.Str(
        load_default="solid",
        validate=validate.OneOf(["solid", "categorical"]),
    ),
    "color": fields.Str(required=True, validate=validate.Length(max=7)),
    "categoricalProperty": fields.Str(load_default="", validate=validate.Length(max=120)),
    "categoricalStops": fields.List(
        fields.Nested(_map_overlay_categorical_stop_item),
        load_default=list,
        validate=validate.Length(max=200),
    ),
    "defaultActive": fields.Bool(load_default=True),
}


_map_overlay_item = {
    "id": fields.Str(required=True, validate=validate.Length(min=1, max=64)),
    "name": fields.Str(required=True, validate=validate.Length(min=1, max=120)),
    "sourceKind": fields.Str(required=True, validate=validate.OneOf(["tilejson", "tiles"])),
    "url": fields.Str(required=True, validate=validate.Length(max=2048)),
    "type": fields.Str(required=True, validate=validate.OneOf(["raster", "vector"])),
    "opacity": fields.Float(required=True, validate=validate.Range(min=0, max=1)),
    "tileSize": fields.Integer(load_default=256, validate=validate.OneOf([256, 512])),
    "layers": fields.List(
        fields.Nested(_map_overlay_vector_layer_item),
        load_default=list,
        validate=validate.Length(max=20),
    ),
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
    "mapBaseLayers": fields.List(
        fields.Nested(_map_base_layer_item, validate=_validate_base_layer_item),
        required=True,
        validate=[validate.Length(max=10), _validate_base_layers],
    ),
    "mapOverlays": fields.List(
        fields.Nested(_map_overlay_item, validate=_validate_map_layer_item),
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


instance_settings_schema_cls = Schema.from_dict(instance_settings_args)
