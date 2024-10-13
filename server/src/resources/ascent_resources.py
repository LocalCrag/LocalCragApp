import datetime

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.orm import joinedload
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from marshmallow_schemas.ascent_schema import ascent_schema, paginated_ascents_schema
from models.area import Area
from models.ascent import Ascent
from models.grades import get_grade_value
from models.line import Line
from models.sector import Sector
from models.todo import Todo
from models.user import User
from util.email import send_project_climbed_email
from util.secret_spots_auth import get_show_secret
from util.validators import cross_validate_grade
from webargs_schemas.ascent_args import (
    ascent_args,
    cross_validate_ascent_args,
    project_climbed_args,
)


class GetAscents(MethodView):

    def get(self):

        user_id = request.args.get("user_id")
        crag_id = request.args.get("crag_id")
        sector_id = request.args.get("sector_id")
        area_id = request.args.get("area_id")
        line_id = request.args.get("line_id")
        page = int(request.args.get("page"))
        per_page = request.args.get("per_page") or None
        if per_page is not None:
            per_page = int(per_page)
        order_by = request.args.get("order_by") or "time_created"
        order_direction = request.args.get("order_direction") or "desc"
        max_grade_value = request.args.get("max_grade") or None
        min_grade_value = request.args.get("min_grade") or None

        if order_by not in ["time_created", "ascent_date", "grade_value"] or order_direction not in ["asc", "desc"]:
            raise BadRequest("Invalid order by query parameters")

        if sum(x is None for x in [max_grade_value, min_grade_value]) == 1:
            raise BadRequest("When filtering for grades, a min and max grade is required.")

        query = db.session.query(Ascent).join(Line).options(joinedload(Ascent.line))

        # Filter for user, crag, sector, area or line
        if crag_id:
            query = query.filter(Ascent.crag_id == crag_id)
        if sector_id:
            query = query.filter(Ascent.sector_id == sector_id)
        if area_id:
            query = query.filter(Ascent.area_id == area_id)
        if user_id:
            query = query.filter(Ascent.created_by_id == user_id)
        if line_id:
            query = query.filter(Ascent.line_id == line_id)

        # Filter by grades
        if min_grade_value and max_grade_value:
            query = query.filter(Line.grade_value <= max_grade_value, Line.grade_value >= min_grade_value)

        # Filter secret spots
        if not get_show_secret():
            query = query.filter(Ascent.line.has(secret=False))

        # Apply ordering
        order_function = None
        if order_by in {"time_created", "ascent_date"}:
            order_function = getattr(getattr(Ascent, order_by), order_direction)
        if order_by in {"grade_value"}:
            order_function = getattr(getattr(Line, "grade_value"), order_direction)
        # Order by Ascent.id as a tie-breaker to prevent duplicate entries in paginate
        query = query.order_by(order_function(), Ascent.id)

        paginated_ascents = db.paginate(query, page=page, per_page=per_page)

        return jsonify(paginated_ascents_schema.dump(paginated_ascents)), 200


class GetTicks(MethodView):

    def get(self):
        user_id = request.args.get("user_id")
        crag_id = request.args.get("crag_id")
        sector_id = request.args.get("sector_id")
        area_id = request.args.get("area_id")
        line_ids = request.args.get("line_ids")
        if not user_id or not (crag_id or sector_id or area_id or line_ids):
            raise BadRequest("Filter query params are not properly defined.")
        query = db.session.query(Ascent.line_id).filter(Ascent.created_by_id == user_id)
        if crag_id:
            query = query.filter(Ascent.crag_id == crag_id)
        if sector_id:
            query = query.filter(Ascent.sector_id == sector_id)
        if area_id:
            query = query.filter(Ascent.area_id == area_id)
        if line_ids:
            line_ids = line_ids.split(",")
            query = query.filter(Ascent.line_id.in_(line_ids))
        ticked_line_ids = [row[0] for row in query.all()]
        return jsonify(ticked_line_ids), 200


class CreateAscent(MethodView):
    @jwt_required()
    def post(self):
        ascent_data = parser.parse(ascent_args, request, validate=cross_validate_ascent_args)
        created_by = User.find_by_email(get_jwt_identity())

        line: Line = Line.find_by_id(ascent_data["line"])
        if get_grade_value(ascent_data["gradeName"], ascent_data["gradeScale"], line.type) < 0:
            raise BadRequest("Projects cannot be ticked.")
        if ascent_data["gradeScale"] != line.grade_scale:
            raise BadRequest("Cannot change grade scale of the climbed line.")
        if not cross_validate_grade(ascent_data["gradeName"], ascent_data["gradeScale"], line.type):
            raise BadRequest("Grade scale, name and line type do not match.")
        if (
            db.session.query(Ascent.line_id)
            .filter(Ascent.created_by_id == created_by.id)
            .filter(Ascent.line_id == ascent_data["line"])
            .first()
        ):
            raise BadRequest("Cannot log a line twice.")

        ascent: Ascent = Ascent()
        ascent.line_id = ascent_data["line"]
        ascent.flash = ascent_data["flash"]
        ascent.fa = ascent_data["fa"]
        ascent.soft = ascent_data["soft"]
        ascent.hard = ascent_data["hard"]
        ascent.with_kneepad = ascent_data["withKneepad"]
        ascent.grade_name = ascent_data["gradeName"]
        ascent.grade_scale = ascent_data["gradeScale"]
        ascent.rating = ascent_data["rating"]
        ascent.comment = ascent_data["comment"]
        ascent.year = ascent_data["year"]
        ascent.date = ascent_data["date"]
        ascent.created_by_id = created_by.id
        ascent.area_id = line.area_id
        ascent.sector_id = Area.find_by_id(line.area_id).sector_id
        ascent.crag_id = Sector.find_by_id(ascent.sector_id).crag_id

        # Set ascent date for ordering
        if ascent.date:
            ascent.ascent_date = ascent.date
        else:
            ascent.ascent_date = datetime.datetime.strptime(str(ascent.year), "%Y").date()

        # Delete To-do if it exists
        todo = Todo.query.filter(Todo.line_id == ascent.line_id).filter(Todo.created_by_id == created_by.id).first()
        if todo:
            db.session.delete(todo)

        db.session.add(line)
        db.session.add(ascent)
        db.session.commit()

        return ascent_schema.dump(ascent), 201


class UpdateAscent(MethodView):
    @jwt_required()
    def put(self, ascent_id):
        ascent_data = parser.parse(ascent_args, request, validate=cross_validate_ascent_args)
        ascent: Ascent = Ascent.find_by_id(ascent_id)

        if not ascent.created_by.email == get_jwt_identity():
            raise Unauthorized("Ascents can only be edited by users themselves.")

        line: Line = Line.find_by_id(ascent.line_id)
        if ascent_data["gradeScale"] != line.grade_scale:
            raise BadRequest("Cannot change grade scale of the climbed line.")
        if not cross_validate_grade(ascent_data["gradeName"], ascent_data["gradeScale"], line.type):
            raise BadRequest("Grade scale, name and line type do not match.")

        ascent.flash = ascent_data["flash"]
        ascent.fa = ascent_data["fa"]
        ascent.soft = ascent_data["soft"]
        ascent.hard = ascent_data["hard"]
        ascent.with_kneepad = ascent_data["withKneepad"]
        ascent.grade_name = ascent_data["gradeName"]
        ascent.grade_scale = ascent_data["gradeScale"]
        ascent.rating = ascent_data["rating"]
        ascent.comment = ascent_data["comment"]
        ascent.year = ascent_data["year"]
        ascent.date = ascent_data["date"]

        # Set ascent date for ordering
        if ascent.date:
            ascent.ascent_date = ascent.date
        else:
            ascent.ascent_date = datetime.datetime.strptime(str(ascent.year), "%Y").date()

        db.session.add(ascent)
        db.session.commit()

        return ascent_schema.dump(ascent), 201


class DeleteAscent(MethodView):
    @jwt_required()
    def delete(self, ascent_id):
        ascent: Ascent = Ascent.find_by_id(ascent_id)

        if not ascent.created_by.email == get_jwt_identity():
            raise Unauthorized("Ascents can only be deleted by users themselves.")

        db.session.delete(ascent)
        db.session.commit()

        return jsonify(None), 204


class SendProjectClimbedMessage(MethodView):

    @jwt_required()
    def post(self):
        project_climbed_data = parser.parse(project_climbed_args, request)

        user: User = User.find_by_email(get_jwt_identity())
        line: Line = Line.find_by_id(project_climbed_data["line"])

        if not line:
            raise NotFound("Line does not exist.")

        if line.grade_value >= 0:
            raise BadRequest("Only projects can be first ascended.")

        # Email all admins
        for admin in User.query.filter(User.admin.is_(True)).all():
            send_project_climbed_email(user, admin, project_climbed_data["message"], line)

        return jsonify(None), 204
