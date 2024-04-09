from marshmallow import fields, post_dump

from extensions import ma
from marshmallow_schemas.file_schema import FileSchema, file_schema
from models.file import File

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from util.bucket_placeholders import replace_bucket_placeholders


class AscentSchema(BaseEntitySchema):
    flash = fields.Boolean()
    fa = fields.Boolean()
    soft = fields.Boolean()
    hard = fields.Boolean()
    withKneepad = fields.Boolean(attribute='with_kneepad')
    gradeName = fields.String(attribute='grade_name')
    gradeScale = fields.String(attribute='grade_scale')
    rating = fields.Integer()
    comment = fields.String()
    year = fields.Integer()
    date = fields.Date()


ascent_schema = AscentSchema()
ascents_schema = AscentSchema(many=True)
