from marshmallow import fields

from extensions import ma
from models.file import File


class FileSchema(ma.SQLAlchemySchema):
    class Meta:
        model = File

    id = ma.auto_field()
    timeCreated = fields.DateTime(attribute="time_created")
    timeUpdated = fields.DateTime(attribute="time_updated")
    filename = ma.auto_field()
    originalFilename = fields.String(attribute='original_filename')


file_schema = FileSchema()
