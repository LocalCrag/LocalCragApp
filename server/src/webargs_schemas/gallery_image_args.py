from webargs import fields

from webargs_schemas.tag_args import tag_args

gallery_image_args = {
    "fileId": fields.UUID(required=True),
    "tags": fields.Nested(tag_args, many=True),
}
