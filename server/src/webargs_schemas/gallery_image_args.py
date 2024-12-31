from webargs import fields

from webargs_schemas.tag_args import tag_args

gallery_image_post_args = {
    "fileId": fields.UUID(required=True),
    "tags": fields.Nested(tag_args, many=True),
}

gallery_image_put_args = {
    "tags": fields.Nested(tag_args, many=True),
}
