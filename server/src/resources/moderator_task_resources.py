import datetime

import pytz
from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import and_, or_, select
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.moderator_task_schema import (
    moderator_task_schema,
    paginated_moderator_tasks_schema,
)
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.moderator_task import ModeratorTask
from models.region import Region
from models.sector import Sector
from models.user import User
from util.bucket_placeholders import add_bucket_placeholders
from util.moderator_task_notifications import (
    notify_task_assigned,
    notify_task_completed,
    notify_task_created,
)
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
    """Resolve list scope from query params."""
    scope_type = request.args.get("scope-type")
    if scope_type not in HIERARCHY_TYPES:
        raise BadRequest("scope-type is required and must be valid")

    if scope_type == "Region":
        region = Region.return_it()
        if not region:
            raise BadRequest("Region not found")
        return scope_type, region.id

    if scope_type == "Crag":
        crag_slug = request.args.get("crag-slug")
        if not crag_slug:
            raise BadRequest("crag-slug is required")
        return scope_type, Crag.get_id_by_slug(crag_slug)

    if scope_type == "Sector":
        sector_slug = request.args.get("sector-slug")
        if not sector_slug:
            raise BadRequest("sector-slug is required")
        return scope_type, Sector.get_id_by_slug(sector_slug)

    if scope_type == "Area":
        area_slug = request.args.get("area-slug")
        if not area_slug:
            raise BadRequest("area-slug is required")
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
    if not assignee.moderator:
        raise BadRequest("Assignee must be a moderator")
    return assignee


def _scope_pairs_for_crag(crag_id):
    pairs = [("Crag", crag_id)]
    sector_rows = db.session.execute(select(Sector.id).where(Sector.crag_id == crag_id)).all()
    sector_ids = [row[0] for row in sector_rows]
    for sector_id in sector_ids:
        pairs.append(("Sector", sector_id))
    if sector_ids:
        area_rows = db.session.execute(select(Area.id).where(Area.sector_id.in_(sector_ids))).all()
        area_ids = [row[0] for row in area_rows]
        for area_id in area_ids:
            pairs.append(("Area", area_id))
        if area_ids:
            line_rows = db.session.execute(select(Line.id).where(Line.area_id.in_(area_ids))).all()
            for (line_id,) in line_rows:
                pairs.append(("Line", line_id))
    return pairs


def _scope_pairs_for_sector(sector_id):
    pairs = [("Sector", sector_id)]
    area_rows = db.session.execute(select(Area.id).where(Area.sector_id == sector_id)).all()
    area_ids = [row[0] for row in area_rows]
    for area_id in area_ids:
        pairs.append(("Area", area_id))
    if area_ids:
        line_rows = db.session.execute(select(Line.id).where(Line.area_id.in_(area_ids))).all()
        for (line_id,) in line_rows:
            pairs.append(("Line", line_id))
    return pairs


def _scope_pairs_for_area(area_id):
    pairs = [("Area", area_id)]
    line_rows = db.session.execute(select(Line.id).where(Line.area_id == area_id)).all()
    for (line_id,) in line_rows:
        pairs.append(("Line", line_id))
    return pairs


def _get_scope_pairs(scope_type: str, scope_id):
    if scope_type == "Region":
        region = Region.find_by_id(scope_id)
        pairs = [("Region", region.id)]
        crag_rows = db.session.execute(select(Crag.id)).all()
        for (crag_id,) in crag_rows:
            pairs.extend(_scope_pairs_for_crag(crag_id))
        return pairs
    if scope_type == "Crag":
        return _scope_pairs_for_crag(scope_id)
    if scope_type == "Sector":
        return _scope_pairs_for_sector(scope_id)
    if scope_type == "Area":
        return _scope_pairs_for_area(scope_id)
    if scope_type == "Line":
        return [("Line", scope_id)]
    raise ValueError(f"Unsupported scope type: {scope_type}")


def _filter_tasks_by_scope(query, scope_type: str, scope_id):
    pairs = _get_scope_pairs(scope_type, scope_id)
    if not pairs:
        return query.filter(False)
    conditions = [
        and_(ModeratorTask.object_type == object_type, ModeratorTask.object_id == object_id)
        for object_type, object_id in pairs
    ]
    return query.filter(or_(*conditions))


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


class GetModeratorTasks(MethodView):
    """List tasks in the hierarchical scope for the current topo page."""

    @jwt_required()
    @check_auth_claims(moderator=True)
    def get(self):
        scope_type, scope_id = _resolve_scope_from_request()
        page = int(request.args.get("page") or 1)
        per_page = int(request.args.get("per_page") or 10)
        query = ModeratorTask.query
        query = _filter_tasks_by_scope(query, scope_type, scope_id)
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
        notify_task_created(task, created_by, db.session.add)
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
        notify_task_assigned(task, actor, previous_assignee_id, db.session.add)
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
            notify_task_completed(task, user, db.session.add)
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
