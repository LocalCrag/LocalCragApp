from webargs import fields

from webargs_schemas.map_marker_args import validate_latitude, validate_longitude
from webargs_schemas.tag_args import tag_args

gallery_image_post_args = {
    "fileId": fields.UUID(required=True),
    "description": fields.Str(required=False, load_default=None, allow_none=True),
    "tags": fields.Nested(tag_args, many=True),
}

gallery_image_put_args = {
    # Omit load_default so partial updates can send only tags or only description.
    "tags": fields.Nested(tag_args, many=True, required=False, allow_none=True),
    "description": fields.Str(required=False, allow_none=True),
    # Manual geotag on the nested file; both null clears GPS.
    "lat": fields.Float(required=False, allow_none=True, validate=validate_latitude),
    "lng": fields.Float(required=False, allow_none=True, validate=validate_longitude),
}
