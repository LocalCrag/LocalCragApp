from marshmallow import fields

from extensions import ma
from models.language import Language


class LanguageSchema(ma.SQLAlchemySchema):
    class Meta:
        model = Language

    id = ma.auto_field()
    code = ma.auto_field()
    isDefaultLanguage = fields.Boolean(attribute='is_default_language')


languages_schema = LanguageSchema(many=True)
