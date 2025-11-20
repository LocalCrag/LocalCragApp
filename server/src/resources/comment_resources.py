from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import and_, func, select
from sqlalchemy.orm import joinedload
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.comment_schema import (
    comment_schema,
    paginated_comments_schema,
    paginated_comments_with_replies_schema,
)
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

        parent_id = data.get("parentId")
        parent = None
        if parent_id:
            parent = Comment.find_by_id(parent_id)
            if not (parent.object_id == target.id and parent.object_type == obj_type):
                raise BadRequest("Reply must reference the same target object as its parent comment.")

        comment = Comment()
        comment.message = data["message"].strip()
        comment.object = target
        comment.created_by_id = created_by.id
        if parent:
            comment.root_id = parent.root_id or parent.id
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

        # Determine if comment has replies
        replies_count = db.session.query(func.count(Comment.id)).filter(Comment.parent_id == comment.id).scalar()
        if replies_count and replies_count > 0:
            # Soft delete: clear author and message and mark as deleted
            comment.message = None
            comment.created_by_id = None
            comment.is_deleted = True
            db.session.add(comment)
        else:
            # Hard delete
            db.session.delete(comment)

        db.session.commit()
        return jsonify(None), 204


class GetComments(MethodView):
    def get(self):
        """Unified endpoint.
        Modes:
          - Thread list (top-level): provide object-type & object-id (no parent-id).
            Returns only root comments with replyCount.
          - Thread replies flat: provide root-id.
        """
        obj_type = request.args.get("object-type")
        obj_id = request.args.get("object-id")
        root_id = request.args.get("root-id")
        page = int(request.args.get("page") or 1)
        per_page = request.args.get("per-page")
        if per_page is not None:
            per_page = int(per_page)
        else:
            raise BadRequest("per-page is required.")

        # helper to apply secret filters
        def apply_secret_filters(query, current_type):
            if get_show_secret() or current_type not in ["Line", "Area", "Sector", "Crag"]:
                return query
            if current_type == "Line":
                return query.join(Line, and_(Comment.object_id == Line.id, Comment.object_type == "Line")).filter(
                    Line.secret.is_(False)
                )
            if current_type == "Area":
                return query.join(Area, and_(Comment.object_id == Area.id, Comment.object_type == "Area")).filter(
                    Area.secret.is_(False)
                )
            if current_type == "Sector":
                return query.join(Sector, and_(Comment.object_id == Sector.id, Comment.object_type == "Sector")).filter(
                    Sector.secret.is_(False)
                )
            if current_type == "Crag":
                return query.join(Crag, and_(Comment.object_id == Crag.id, Comment.object_type == "Crag")).filter(
                    Crag.secret.is_(False)
                )
            return query

        query = select(Comment).options(joinedload(Comment.created_by))
        filters = []
        order_by_cols = []
        current_type_for_secret = None

        is_replies_mode = bool(root_id)
        if is_replies_mode:
            # Replies mode: fetch the whole thread (excluding root)
            root = Comment.find_by_id(root_id)
            current_type_for_secret = root.object_type
            filters.extend([Comment.root_id == root_id])
            order_by_cols = [Comment.time_created.asc(), Comment.id]
        else:
            # Top-level listing requires object info
            if obj_type not in ["Line", "Area", "Sector", "Crag", "Region", "Post"] or not obj_id:
                raise BadRequest("object-type and object-id are required and must be valid.")
            current_type_for_secret = obj_type
            filters.extend(
                [
                    Comment.object_type == obj_type,
                    Comment.object_id == obj_id,
                    Comment.parent_id.is_(None),
                ]
            )
            order_by_cols = [Comment.time_created.desc(), Comment.id]

        # Apply filters and ordering
        if filters:
            query = query.filter(and_(*filters))
        if order_by_cols:
            query = query.order_by(*order_by_cols)

        # Apply secret filtering
        query = apply_secret_filters(query, current_type_for_secret)

        # Paginate once
        paginated = db.paginate(query, page=page, per_page=per_page)

        # Serialize depending on mode
        if is_replies_mode:
            return paginated_comments_schema.dump(paginated), 200
        else:
            # augment top-level comments with reply counts
            top_ids = [c.id for c in paginated.items]
            if top_ids:
                rows = (
                    db.session.query(Comment.root_id, func.count(Comment.id))
                    .filter(Comment.root_id.in_(top_ids))
                    .group_by(Comment.root_id)
                    .all()
                )
                counts = {root_id: count for (root_id, count) in rows}
            else:
                counts = {}
            for c in paginated.items:
                c._reply_count = int(counts.get(c.id, 0))
            return paginated_comments_with_replies_schema.dump(paginated), 200
