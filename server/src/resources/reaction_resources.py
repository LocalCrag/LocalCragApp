from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from marshmallow_schemas.reactions_schema import ReactionUserListSchema
from models.ascent import Ascent
from models.comment import Comment
from models.enums.notification_type_enum import NotificationTypeEnum
from models.reaction import Reaction
from models.user import User
from util.notifications import create_notification_for_user
from util.reactions import get_reactions_by_user
from webargs_schemas.reaction_args import reaction_args


def _resolve_target(target_type: str, target_id: str):
    """Resolve and validate that the target exists.

    Keep this small; we can extend supported types later.
    """

    if target_type == "ascent":
        return Ascent.find_by_id(target_id)

    if target_type == "comment":
        comment = Comment.find_by_id(target_id)
        if comment and comment.is_deleted:
            return None
        return comment

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

        # Disallow reacting to own content
        if getattr(target, "created_by_id", None) == user.id:
            raise BadRequest("Cannot react to your own content.")

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

        target_owner_id = getattr(target, "created_by_id", None)
        target_owner = User.find_by_id(target_owner_id) if target_owner_id else None
        if target_owner and target_owner.id != user.id:
            db.session.add(
                create_notification_for_user(
                    target_owner.id,
                    NotificationTypeEnum.REACTION,
                    actor_id=user.id,
                    entity_type=target_type,
                    entity_id=target.id,
                )
            )
        db.session.commit()

        reactions = get_reactions_by_user(target_type, [str(target.id)]).get(str(target.id), [])
        return jsonify(ReactionUserListSchema(many=True).dump(reactions)), 201


class UpdateReaction(MethodView):
    @jwt_required()
    def put(self, target_type: str, target_id: str):
        data = parser.parse(reaction_args, request)
        emoji = data["emoji"]

        user: User = User.find_by_email(get_jwt_identity())

        target = _resolve_target(target_type, target_id)
        if not target:
            raise NotFound("Target does not exist.")

        # Disallow reacting to own content
        if getattr(target, "created_by_id", None) == user.id:
            raise BadRequest("Cannot react to your own content.")

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

        reactions = get_reactions_by_user(target_type, [str(target.id)]).get(str(target.id), [])
        return jsonify(ReactionUserListSchema(many=True).dump(reactions)), 200


class DeleteReaction(MethodView):
    @jwt_required()
    def delete(self, target_type: str, target_id: str):
        user: User = User.find_by_email(get_jwt_identity())

        target = _resolve_target(target_type, target_id)
        if not target:
            raise NotFound("Target does not exist.")

        reaction = (
            Reaction.query.filter(Reaction.created_by_id == user.id)
            .filter(Reaction.target_type == target_type)
            .filter(Reaction.target_id == target_id)
            .first()
        )

        if reaction:
            db.session.delete(reaction)
            db.session.commit()

        reactions = get_reactions_by_user(target_type, [str(target.id)]).get(str(target.id), [])
        return jsonify(ReactionUserListSchema(many=True).dump(reactions)), 200
