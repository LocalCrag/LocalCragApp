from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import file_schema
from marshmallow_schemas.tag_schema import tag_schema


class GalleryImageSchema(ma.SQLAlchemySchema):
    id = fields.String()
    image = fields.Nested(file_schema, attribute="file")
    tags = fields.Nested(tag_schema, many=True)


gallery_images_schema = GalleryImageSchema(many=True)
gallery_image_schema = GalleryImageSchema()
