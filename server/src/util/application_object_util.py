from typing import List

from sqlalchemy.exc import ProgrammingError

from extensions import db
from models.language import Language


def load_entity_types(app):
    """
    Adds a dictionary of entity types to the app object.
    """
    entity_types: List[EntityType] = EntityType.return_all()
    entity_type_dict = {e.name: e for e in entity_types}
    entity_type_dict_by_id = {e.id: e for e in entity_types}
    app.entity_types = entity_type_dict
    app.entity_types_by_id = entity_type_dict_by_id


def load_languages(app):
    """
    Adds a list of languages to the app object.
    Also attaches the default language with a separate key.
    """
    languages: List[Language] = Language.return_all()
    app.languages = languages
    app.default_language = [language for language in languages if language.is_default_language][0]


def load_internal_entity_accessor(app):
    """
    Adds the entity accessor to the app object.
    """
    entity_accessor: List[InternalEntityAccessor] = InternalEntityAccessor.return_instance()
    app.entity_accessor = entity_accessor


def add_app_utils(app):
    """
    Adds utilities to the app object.
    """
    with app.app_context():
        try:
            load_entity_types(app)
            load_languages(app)
            load_internal_entity_accessor(app)
        except ProgrammingError:  # Undefined Table when running DB Upgrade from empty db, just pass
            pass
        db.session.close()
