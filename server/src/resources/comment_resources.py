from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.comment_schema import comment_schema, paginated_comments_schema
from models.area import Area
from models.comment import Comment
from models.crag import Crag
from models.line import Line
from models.region import Region
from models.sector import Sector
from models.user import User
from util.secret_spots_auth import get_show_secret
from webargs_schemas.comment_args import comment_args, comment_update_args


class CreateComment(MethodView):
    @jwt_required()
    def post(self):
        data = parser.parse(comment_args, request)
        created_by: User = User.find_by_email(get_jwt_identity())

        # Validate generic target type/id
        target = None
        obj_type = data["objectType"]
        obj_id = data["objectId"]
        if obj_type == "Line":
            target = Line.find_by_id(obj_id)
        elif obj_type == "Area":
            target = Area.find_by_id(obj_id)
        elif obj_type == "Sector":
            target = Sector.find_by_id(obj_id)
        elif obj_type == "Crag":
            target = Crag.find_by_id(obj_id)
        elif obj_type == "Region":
            target = Region.find_by_id(obj_id)
        else:
            raise BadRequest("Unsupported object type")

        # Enforce secret spot visibility
        if hasattr(target, "secret") and target.secret and not get_show_secret():
            raise NotFound()

        comment = Comment()
        comment.message = data["message"].strip()
        comment.object = target
        comment.created_by_id = created_by.id

        # Optional reply-to
        parent_id = data.get("parentId")
        if parent_id:
            parent = Comment.find_by_id(parent_id)
            # Ensure parent references the same object
            if not (parent.object_id == comment.object_id and parent.object_type == comment.object_type):
                raise BadRequest("Reply must reference the same target object as its parent comment.")
            comment.parent_id = parent.id

        db.session.add(comment)
        db.session.commit()

        return comment_schema.dump(comment), 201


class UpdateComment(MethodView):
    @jwt_required()
    def put(self, comment_id):
        data = parser.parse(comment_update_args, request)
        user = User.find_by_email(get_jwt_identity())
        comment: Comment = Comment.find_by_id(comment_id)
        if comment.created_by_id != user.id:
            raise Unauthorized("Only the creator can edit the comment.")
        comment.message = data["message"].strip()
        db.session.add(comment)
        db.session.commit()
        return comment_schema.dump(comment), 200


class DeleteComment(MethodView):
    @jwt_required()
    def delete(self, comment_id):
        user = User.find_by_email(get_jwt_identity())
        comment: Comment = Comment.find_by_id(comment_id)
        if comment.created_by_id != user.id and not user.moderator and not user.admin:
            raise Unauthorized("Only the creator or a moderator can delete the comment.")
        db.session.delete(comment)
        db.session.commit()
        return jsonify(None), 204


class GetComments(MethodView):
    def get(self):
        obj_type = request.args.get("object_type")
        obj_id = request.args.get("object_id")
        page = int(request.args.get("page") or 1)
        per_page = request.args.get("per_page") or None
        if per_page is not None:
            per_page = int(per_page)

        if obj_type not in ["Line", "Area", "Sector", "Crag", "Region", "Post"] or not obj_id:
            raise BadRequest("object_type and object_id are required and must be valid.")

        # Base query
        query = (
            select(Comment)
            .options(joinedload(Comment.created_by))
            .filter(Comment.object_type == obj_type, Comment.object_id == obj_id)
            .order_by(Comment.time_created.desc(), Comment.id)
        )

        # Filter secret spots by joining to the actual table if needed
        if not get_show_secret() and obj_type in ["Line", "Area", "Sector", "Crag"]:
            if obj_type == "Line":
                query = query.join(Line, (Comment.object_id == Line.id) & (Comment.object_type == "Line")).filter(
                    Line.secret.is_(False)
                )
            if obj_type == "Area":
                query = query.join(Area, (Comment.object_id == Area.id) & (Comment.object_type == "Area")).filter(
                    Area.secret.is_(False)
                )
            if obj_type == "Sector":
                query = query.join(Sector, (Comment.object_id == Sector.id) & (Comment.object_type == "Sector")).filter(
                    Sector.secret.is_(False)
                )
            if obj_type == "Crag":
                query = query.join(Crag, (Comment.object_id == Crag.id) & (Comment.object_type == "Crag")).filter(
                    Crag.secret.is_(False)
                )

        paginated = db.paginate(query, page=page, per_page=per_page)
        return paginated_comments_schema.dump(paginated), 200
