from typing import List

from sqlalchemy.exc import ProgrammingError

from extensions import db
from models.language import Language


def load_languages(app):
    """
    Adds a list of languages to the app object.
    Also attaches the default language with a separate key.
    """
    languages: List[Language] = Language.return_all()
    app.languages = languages
    app.default_language = [language for language in languages if language.is_default_language][0]


def add_app_utils(app):
    """
    Adds utilities to the app object.
    """
    with app.app_context():
        try:
            load_languages(app)
        except ProgrammingError:  # Undefined Table when running DB Upgrade from empty db, just pass
            pass
        db.session.close()
