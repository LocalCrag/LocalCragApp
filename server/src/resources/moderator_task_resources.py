import datetime

import pytz
from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.moderator_task_schema import (
    moderator_task_schema,
    paginated_moderator_tasks_schema,
)
from models.area import Area
from models.crag import Crag
from models.enums.notification_type_enum import NotificationTypeEnum
from models.line import Line
from models.moderator_task import ModeratorTask
from models.region import Region
from models.sector import Sector
from models.user import User
from util.bucket_placeholders import add_bucket_placeholders
from util.moderator_task_scope import filter_tasks_by_scope
from util.notifications import create_notification_for_user
from util.security_util import check_auth_claims
from webargs_schemas.moderator_task_args import (
    moderator_task_args,
    moderator_task_update_args,
)

HIERARCHY_TYPES = {"Region", "Crag", "Sector", "Area", "Line"}


def _resolve_target(object_type: str, object_id):
    if object_type not in HIERARCHY_TYPES:
        raise BadRequest("Unsupported object type")
    if object_type == "Region":
        return Region.find_by_id(object_id)
    if object_type == "Crag":
        return Crag.find_by_id(object_id)
    if object_type == "Sector":
        return Sector.find_by_id(object_id)
    if object_type == "Area":
        return Area.find_by_id(object_id)
    if object_type == "Line":
        return Line.find_by_id(object_id)
    raise BadRequest("Unsupported object type")


def _resolve_scope_from_request():
    scope_type = request.args.get("scope-type")
    if scope_type not in HIERARCHY_TYPES:
        raise BadRequest("scope-type is required and must be valid")

    if scope_type == "Region":
        region = Region.return_it()
        if not region:
            raise BadRequest("Region not found")
        return scope_type, region.id

    crag_slug = request.args.get("crag-slug")
    if not crag_slug:
        raise BadRequest("crag-slug is required")

    if scope_type == "Crag":
        return scope_type, Crag.get_id_by_slug(crag_slug)

    sector_slug = request.args.get("sector-slug")
    if scope_type in {"Sector", "Area", "Line"} and not sector_slug:
        raise BadRequest("sector-slug is required")

    if scope_type == "Sector":
        return scope_type, Sector.get_id_by_slug(sector_slug)

    area_slug = request.args.get("area-slug")
    if scope_type in {"Area", "Line"} and not area_slug:
        raise BadRequest("area-slug is required")

    if scope_type == "Area":
        return scope_type, Area.get_id_by_slug(area_slug)

    line_slug = request.args.get("line-slug")
    if not line_slug:
        raise BadRequest("line-slug is required")
    return scope_type, Line.get_id_by_slug(line_slug)


def _resolve_assigned_to(assigned_to_id):
    if not assigned_to_id:
        return None
    assignee = User.find_by_id(assigned_to_id)
    if not assignee.activated:
        raise BadRequest("Assignee must be an activated user")
    return assignee


def _moderator_recipient_ids_excluding(actor: User, *also_exclude):
    exclude = {actor.id, *also_exclude}
    recipient_ids = set()
    moderators = User.query.filter(
        (User.moderator.is_(True)) | (User.admin.is_(True)) | (User.superadmin.is_(True))
    ).all()
    for moderator in moderators:
        if moderator.id not in exclude:
            recipient_ids.add(moderator.id)
    return recipient_ids


def _task_notification_recipient_ids(task: ModeratorTask, actor: User):
    recipient_ids = _moderator_recipient_ids_excluding(actor)
    if task.assigned_to_id and task.assigned_to_id != actor.id:
        recipient_ids.add(task.assigned_to_id)
    return recipient_ids


def _add_task_notification(task: ModeratorTask, actor: User, user_id, notification_type: NotificationTypeEnum):
    db.session.add(
        create_notification_for_user(
            user_id,
            notification_type,
            actor_id=actor.id,
            entity_type="moderator_task",
            entity_id=task.id,
        )
    )


def _notify_task_created(task: ModeratorTask, actor: User):
    assignee_id = task.assigned_to_id
    for user_id in _moderator_recipient_ids_excluding(actor, assignee_id):
        _add_task_notification(task, actor, user_id, NotificationTypeEnum.MODERATOR_TASK_CREATED)
    if assignee_id and assignee_id != actor.id:
        _add_task_notification(
            task,
            actor,
            assignee_id,
            NotificationTypeEnum.MODERATOR_TASK_CREATED_AND_ASSIGNED,
        )


def _notify_task_assigned(task: ModeratorTask, actor: User, previous_assignee_id):
    if task.assigned_to_id and task.assigned_to_id != actor.id and task.assigned_to_id != previous_assignee_id:
        _add_task_notification(
            task,
            actor,
            task.assigned_to_id,
            NotificationTypeEnum.MODERATOR_TASK_ASSIGNED,
        )


def _apply_task_list_filters(query):
    assigned_to_unassigned = request.args.get("assigned-to-unassigned")
    if assigned_to_unassigned in ("true", "1"):
        query = query.filter(ModeratorTask.assigned_to_id.is_(None))
    else:
        assigned_to_id = request.args.get("assigned-to-id")
        if assigned_to_id:
            query = query.filter(ModeratorTask.assigned_to_id == assigned_to_id)
    created_by_id = request.args.get("created-by-id")
    if created_by_id:
        query = query.filter(ModeratorTask.created_by_id == created_by_id)
    finished_by_id = request.args.get("finished-by-id")
    if finished_by_id:
        query = query.filter(ModeratorTask.finished_by_id == finished_by_id)
    return query


def _order_tasks_for_list(query):
    return query.order_by(
        ModeratorTask.completed.asc(),
        ModeratorTask.time_finished.desc().nullslast(),
        ModeratorTask.time_created.desc(),
        ModeratorTask.id.desc(),
    )


def _notify_for_task(task: ModeratorTask, actor: User, notification_type: NotificationTypeEnum):
    for user_id in _task_notification_recipient_ids(task, actor):
        db.session.add(
            create_notification_for_user(
                user_id,
                notification_type,
                actor_id=actor.id,
                entity_type="moderator_task",
                entity_id=task.id,
            )
        )


class GetModeratorTasks(MethodView):
    """List tasks in the hierarchical scope for the current topo page (see util/moderator_task_scope)."""

    @jwt_required()
    @check_auth_claims(moderator=True)
    def get(self):
        scope_type, scope_id = _resolve_scope_from_request()
        page = int(request.args.get("page") or 1)
        per_page = int(request.args.get("per_page") or 10)
        query = ModeratorTask.query
        query = filter_tasks_by_scope(query, scope_type, scope_id)
        query = _apply_task_list_filters(query)
        query = _order_tasks_for_list(query)
        paginated_tasks = db.paginate(query, page=page, per_page=per_page)
        return jsonify(paginated_moderator_tasks_schema.dump(paginated_tasks)), 200


class GetModeratorTask(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def get(self, task_id):
        task = ModeratorTask.find_by_id(task_id)
        return moderator_task_schema.dump(task), 200


class CreateModeratorTask(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def post(self):
        data = parser.parse(moderator_task_args, request)
        created_by = User.find_by_email(get_jwt_identity())
        target = _resolve_target(data["objectType"], data["objectId"])

        task = ModeratorTask()
        task.title = data["title"].strip()
        task.description = add_bucket_placeholders(data["description"]) if data.get("description") else None
        task.object = target
        task.created_by_id = created_by.id
        assignee = _resolve_assigned_to(data.get("assignedToId"))
        task.assigned_to_id = assignee.id if assignee else None

        db.session.add(task)
        db.session.flush()
        _notify_task_created(task, created_by)
        db.session.commit()
        return moderator_task_schema.dump(task), 201


class UpdateModeratorTask(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, task_id):
        data = parser.parse(moderator_task_update_args, request)
        actor = User.find_by_email(get_jwt_identity())
        task = ModeratorTask.find_by_id(task_id)
        previous_assignee_id = task.assigned_to_id
        task.title = data["title"].strip()
        task.description = add_bucket_placeholders(data["description"]) if data.get("description") else None
        assignee = _resolve_assigned_to(data.get("assignedToId"))
        task.assigned_to_id = assignee.id if assignee else None
        db.session.add(task)
        db.session.flush()
        _notify_task_assigned(task, actor, previous_assignee_id)
        db.session.commit()
        return moderator_task_schema.dump(task), 200


class ToggleModeratorTaskComplete(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def post(self, task_id):
        user = User.find_by_email(get_jwt_identity())
        task = ModeratorTask.find_by_id(task_id)
        was_completed = task.completed
        task.completed = not task.completed
        if task.completed and not was_completed:
            task.time_finished = datetime.datetime.now(pytz.utc)
            task.finished_by_id = user.id
            _notify_for_task(task, user, NotificationTypeEnum.MODERATOR_TASK_COMPLETED)
        elif not task.completed:
            task.time_finished = None
            task.finished_by_id = None
        db.session.add(task)
        db.session.commit()
        return moderator_task_schema.dump(task), 200


class DeleteModeratorTask(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def delete(self, task_id):
        task = ModeratorTask.find_by_id(task_id)
        db.session.delete(task)
        db.session.commit()
        return jsonify(None), 204
