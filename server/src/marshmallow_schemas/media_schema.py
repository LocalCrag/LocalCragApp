from marshmallow import fields

from extensions import ma
from models.media import Media


class MediaSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Media

    id = ma.auto_field()
    timeCreated = fields.DateTime(attribute="time_created")
    timeUpdated = fields.DateTime(attribute="time_updated")
    filename = ma.auto_field()
    originalFilename = fields.String(attribute='original_filename')
    width = ma.auto_field()
    height = ma.auto_field()
    thumbnailXS = fields.Boolean(attribute='thumbnail_xs')
    thumbnailS = fields.Boolean(attribute='thumbnail_s')
    thumbnailM = fields.Boolean(attribute='thumbnail_m')
    thumbnailL = fields.Boolean(attribute='thumbnail_l')
    thumbnailXL = fields.Boolean(attribute='thumbnail_xl')


media_schema = MediaSchema()
