from flask import jsonify
from flask.views import MethodView
from flask_jwt_extended import jwt_required

from marshmallow_schemas.language_schema import languages_schema
from models.language import Language


class GetLanguages(MethodView):

    @jwt_required()
    def get(self):
        """
        Returns the list of languages.
        """
        return jsonify(languages_schema.dump(Language.return_all())), 200


