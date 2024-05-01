from marshmallow import fields

from extensions import ma
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class FileSchema(BaseEntitySchema):
    filename = fields.String(attribute='filename_with_host')
    originalFilename = fields.String(attribute='original_filename')
    width = fields.Integer()
    height = fields.Integer()
    thumbnailXS = fields.Boolean(attribute='thumbnail_xs')
    thumbnailS = fields.Boolean(attribute='thumbnail_s')
    thumbnailM = fields.Boolean(attribute='thumbnail_m')
    thumbnailL = fields.Boolean(attribute='thumbnail_l')
    thumbnailXL = fields.Boolean(attribute='thumbnail_xl')

class FileSchemaWithoutUser(ma.SQLAlchemySchema):
    id = fields.String()
    timeCreated = fields.DateTime(attribute="time_created")
    timeUpdated = fields.DateTime(attribute="time_updated")
    filename = fields.String(attribute='filename_with_host')
    originalFilename = fields.String(attribute='original_filename')
    width = fields.Integer()
    height = fields.Integer()
    thumbnailXS = fields.Boolean(attribute='thumbnail_xs')
    thumbnailS = fields.Boolean(attribute='thumbnail_s')
    thumbnailM = fields.Boolean(attribute='thumbnail_m')
    thumbnailL = fields.Boolean(attribute='thumbnail_l')
    thumbnailXL = fields.Boolean(attribute='thumbnail_xl')


file_schema = FileSchema()
file_schema_without_user = FileSchemaWithoutUser()
