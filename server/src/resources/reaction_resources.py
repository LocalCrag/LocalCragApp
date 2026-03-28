from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from models.ascent import Ascent
from models.reaction import Reaction
from models.user import User
from webargs_schemas.reaction_args import reaction_args


def _resolve_target(target_type: str, target_id: str):
    """Resolve and validate that the target exists.

    Keep this small; we can extend supported types later.
    """

    if target_type == "ascent":
        return Ascent.find_by_id(target_id)

    raise BadRequest("Unsupported target type")


class CreateReaction(MethodView):
    @jwt_required()
    def post(self, target_type: str, target_id: str):
        data = parser.parse(reaction_args, request)
        emoji = data["emoji"]

        user: User = User.find_by_email(get_jwt_identity())

        target = _resolve_target(target_type, target_id)
        if not target:
            raise NotFound("Target does not exist.")

        # One-per-user-per-target: create only if missing
        existing = (
            Reaction.query.filter(Reaction.created_by_id == user.id)
            .filter(Reaction.target_type == target_type)
            .filter(Reaction.target_id == target.id)
            .first()
        )
        if existing:
            raise BadRequest("Reaction already exists for this target.")

        reaction = Reaction()
        reaction.created_by_id = user.id
        reaction.target_type = target_type
        reaction.target_id = target.id
        reaction.emoji = emoji

        db.session.add(reaction)
        db.session.commit()
        return jsonify(None), 201


class UpdateReaction(MethodView):
    @jwt_required()
    def put(self, target_type: str, target_id: str):
        data = parser.parse(reaction_args, request)
        emoji = data["emoji"]

        user: User = User.find_by_email(get_jwt_identity())

        target = _resolve_target(target_type, target_id)
        if not target:
            raise NotFound("Target does not exist.")

        reaction = (
            Reaction.query.filter(Reaction.created_by_id == user.id)
            .filter(Reaction.target_type == target_type)
            .filter(Reaction.target_id == target.id)
            .first()
        )

        if not reaction:
            raise NotFound("Reaction does not exist.")

        reaction.emoji = emoji
        db.session.add(reaction)
        db.session.commit()
        return jsonify(None), 200


class DeleteReaction(MethodView):
    @jwt_required()
    def delete(self, target_type: str, target_id: str):
        user: User = User.find_by_email(get_jwt_identity())

        reaction = (
            Reaction.query.filter(Reaction.created_by_id == user.id)
            .filter(Reaction.target_type == target_type)
            .filter(Reaction.target_id == target_id)
            .first()
        )

        if reaction:
            db.session.delete(reaction)
            db.session.commit()

        return jsonify(None), 204
