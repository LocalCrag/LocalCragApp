from marshmallow import fields

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from models.language import Language


class LanguageSchema(BaseEntitySchema):
    code = fields.String()
    isDefaultLanguage = fields.Boolean(attribute='is_default_language')


languages_schema = LanguageSchema(many=True)
