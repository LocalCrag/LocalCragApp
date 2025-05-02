from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.todo_schema import paginated_todos_schema, todo_schema
from models.area import Area
from models.ascent import Ascent
from models.enums.line_type_enum import LineTypeEnum
from models.instance_settings import InstanceSettings
from models.line import Line
from models.sector import Sector
from models.todo import Todo
from models.user import User
from util.secret_spots_auth import get_show_secret
from webargs_schemas.todo_args import todo_args, todo_priority_args


class CreateTodo(MethodView):
    @jwt_required()
    def post(self):
        todo_data = parser.parse(todo_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        line: Line = Line.find_by_id(todo_data["line"])
        if (
            db.session.query(Todo.line_id)
            .filter(Todo.created_by_id == created_by.id)
            .filter(Todo.line_id == todo_data["line"])
            .first()
        ):
            raise BadRequest("Cannot add a line as todo twice.")
        if (
            db.session.query(Ascent.line_id)
            .filter(Ascent.created_by_id == created_by.id)
            .filter(Ascent.line_id == todo_data["line"])
            .first()
        ):
            raise BadRequest("Cannot add a line as todo if already climbed.")

        todo: Todo = Todo()
        todo.line_id = todo_data["line"]
        todo.created_by_id = created_by.id
        todo.area_id = line.area_id
        todo.sector_id = Area.find_by_id(line.area_id).sector_id
        todo.crag_id = Sector.find_by_id(todo.sector_id).crag_id

        db.session.add(todo)
        db.session.commit()

        return todo_schema.dump(todo), 201


class GetTodos(MethodView):

    @jwt_required()
    def get(self):
        instance_settings = InstanceSettings.return_it()
        user = User.find_by_email(get_jwt_identity())
        crag_id = request.args.get("crag_id")
        sector_id = request.args.get("sector_id")
        area_id = request.args.get("area_id")
        page = int(request.args.get("page"))
        per_page = request.args.get("per_page") or None
        if per_page is not None:
            per_page = int(per_page)
        order_by = request.args.get("order_by") or "time_created"
        order_direction = request.args.get("order_direction") or "desc"
        max_grade_value = request.args.get("max_grade") or None
        min_grade_value = request.args.get("min_grade") or None
        priority = request.args.get("priority") or None
        line_type = request.args.get("line_type", None, type=LineTypeEnum)
        grade_scale = request.args.get("grade_scale", None)

        if order_by not in ["grade_value", "time_created"] or order_direction not in ["asc", "desc"]:
            raise BadRequest("Invalid order by query parameters")

        if sum(x is None for x in [max_grade_value, min_grade_value]) == 1:
            raise BadRequest("When filtering for grades, a min and max grade is required.")

        query = select(Todo).join(Line).options(joinedload(Todo.line))

        # Filter for user, crag, sector or area
        query = query.filter(Todo.created_by_id == user.id, Line.archived.is_(False))
        if crag_id:
            query = query.filter(Todo.crag_id == crag_id)
        if sector_id:
            query = query.filter(Todo.sector_id == sector_id)
        if area_id:
            query = query.filter(Todo.area_id == area_id)
        if line_type:
            query = query.filter(Line.type == line_type)
        if grade_scale:
            query = query.filter(Line.grade_scale == grade_scale)

        # Filter by grades
        if min_grade_value and max_grade_value:
            if instance_settings.display_user_grades_ratings:
                query = query.filter(Line.user_grade_value <= max_grade_value, Line.user_grade_value >= min_grade_value)
            else:
                query = query.filter(
                    Line.author_grade_value <= max_grade_value, Line.author_grade_value >= min_grade_value
                )

        # Filter by priority
        if priority:
            query = query.filter(Todo.priority == priority)

        # Filter secret spots
        if not get_show_secret():
            query = query.filter(Todo.line.has(secret=False))

        # Apply ordering
        order_function = None
        if order_by in {"grade_value"}:
            if instance_settings.display_user_grades_ratings:
                order_function = getattr(Line.user_grade_value, order_direction)
            else:
                order_function = getattr(Line.author_grade_value, order_direction)
        if order_by in {"time_created"}:
            order_function = getattr(Todo.time_created, order_direction)
        # Order by To-do.id as a tie-breaker to prevent duplicate entries in paginate
        query = query.order_by(order_function(), Todo.id)

        paginated_todos = db.paginate(query, page=page, per_page=per_page)

        return jsonify(paginated_todos_schema.dump(paginated_todos)), 200


class DeleteTodo(MethodView):
    @jwt_required()
    def delete(self, todo_id):
        user = User.find_by_email(get_jwt_identity())
        todo = Todo.query.filter(Todo.id == todo_id).filter(Todo.created_by_id == user.id).first()
        if not todo:
            raise BadRequest("Todo not found.")
        db.session.delete(todo)
        db.session.commit()
        return jsonify(None), 204


class UpdateTodoPriority(MethodView):
    @jwt_required()
    def put(self, todo_id):
        user = User.find_by_email(get_jwt_identity())
        todo = Todo.query.filter(Todo.id == todo_id).filter(Todo.created_by_id == user.id).first()
        if not todo:
            raise BadRequest("Todo not found.")
        todo_data = parser.parse(todo_priority_args, request)
        todo.priority = todo_data["priority"]
        db.session.commit()
        return todo_schema.dump(todo), 200


class GetIsTodo(MethodView):

    def get(self):
        user_id = request.args.get("user_id")
        crag_id = request.args.get("crag_id")
        sector_id = request.args.get("sector_id")
        area_id = request.args.get("area_id")
        line_ids = request.args.get("line_ids")
        if not user_id or not (crag_id or sector_id or area_id or line_ids):
            raise BadRequest("Filter query params are not properly defined.")
        query = db.session.query(Todo.line_id).filter(Todo.created_by_id == user_id)
        if crag_id:
            query = query.filter(Todo.crag_id == crag_id)
        if sector_id:
            query = query.filter(Todo.sector_id == sector_id)
        if area_id:
            query = query.filter(Todo.area_id == area_id)
        if line_ids:
            line_ids = line_ids.split(",")
            query = query.filter(Todo.line_id.in_(line_ids))
        todo_line_ids = [row[0] for row in query.all()]
        return jsonify(todo_line_ids), 200
