from marshmallow import fields

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class PostSchema(BaseEntitySchema):
    title = fields.String()
    text = fields.String()


post_schema = PostSchema()
posts_schema = PostSchema(many=True)
