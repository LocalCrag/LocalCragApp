from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import file_schema
from marshmallow_schemas.tag_schema import tag_schema


class GalleryImageSchema(ma.SQLAlchemySchema):
    id = fields.String()
    createdBy = ma.Nested("UserMinSchema", attribute="created_by")
    image = fields.Nested(file_schema, attribute="file")
    tags = fields.Nested(tag_schema, many=True)

class PaginatedLinesSchema(ma.SQLAlchemySchema):
    items = fields.List(fields.Nested(GalleryImageSchema()))
    hasNext = fields.Boolean(attribute="has_next")

paginated_gallery_images_schema = PaginatedLinesSchema()
gallery_image_schema = GalleryImageSchema()
