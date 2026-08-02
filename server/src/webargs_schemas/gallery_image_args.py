from webargs import fields

from webargs_schemas.map_marker_args import validate_latitude, validate_longitude
from webargs_schemas.tag_args import tag_args

gallery_image_post_args = {
    "fileId": fields.UUID(required=True),
    "description": fields.Str(required=False, load_default=None, allow_none=True),
    "tags": fields.Nested(tag_args, many=True),
}

gallery_image_put_args = {
    "tags": fields.Nested(tag_args, many=True, required=True),
    "description": fields.Str(required=True, allow_none=True),
    "lat": fields.Float(required=True, allow_none=True, validate=validate_latitude),
    "lng": fields.Float(required=True, allow_none=True, validate=validate_longitude),
}
