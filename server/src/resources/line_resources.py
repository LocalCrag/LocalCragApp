from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func, nullslast
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.line_schema import (
    line_schema,
    lines_schema,
    paginated_lines_schema,
)
from models.area import Area
from models.crag import Crag
from models.enums.line_type_enum import LineTypeEnum
from models.line import Line
from models.sector import Sector
from models.user import User
from util.secret_spots import set_line_parents_unsecret, update_line_secret_property
from util.secret_spots_auth import get_show_secret
from util.security_util import check_auth_claims, check_secret_spot_permission
from util.validators import cross_validate_grade
from webargs_schemas.line_args import line_args


class GetLinesForLineEditor(MethodView):

    def get(self, area_slug):
        """
        Returns all lines of an area which is needed for the line select in the line editor.
        """
        lines = Line.query.join(Area).filter(Line.archived.is_(False), Area.slug == area_slug).order_by(Line.name).all()
        return jsonify(lines_schema.dump(lines)), 200


class GetLines(MethodView):

    def get(self):
        """
        Returns all lines of an area in a paginated manner.
        """
        crag_slug = request.args.get("crag_slug")
        sector_slug = request.args.get("sector_slug")
        area_slug = request.args.get("area_slug")
        page = request.args.get("page") or 1
        per_page = request.args.get("per_page") or None
        if per_page is not None:
            per_page = int(per_page)
        order_by = request.args.get("order_by") or None
        order_direction = request.args.get("order_direction") or "asc"
        max_grade_value = request.args.get("max_grade") or None
        min_grade_value = request.args.get("min_grade") or None
        archived = request.args.get("archived", False, type=bool)  # default: hide archived lines
        line_type = request.args.get("line_type", None, type=LineTypeEnum)
        grade_scale = request.args.get("grade_scale", None)

        # todo add filter options for linetype+gradescale

        if order_by not in ["grade_value", "name", "rating", None] or order_direction not in ["asc", "desc"]:
            raise BadRequest("Invalid order by query parameters")

        if sum(x is None for x in [max_grade_value, min_grade_value]) == 1:
            raise BadRequest("When filtering for grades, a min and max grade is required.")

        # Filter for crag, sector or area
        query = Line.query.filter(Line.archived == archived).join(Area).join(Sector).join(Crag)
        if crag_slug:
            query = query.filter(Crag.slug == crag_slug)
        if sector_slug:
            query = query.filter(Sector.slug == sector_slug)
        if area_slug:
            query = query.filter(Area.slug == area_slug)
        if line_type:
            query = query.filter(Line.type == line_type)
        if grade_scale:
            query = query.filter(Line.grade_scale == grade_scale)

        # Filter by grades
        if min_grade_value and max_grade_value:
            query = query.filter(Line.grade_value <= max_grade_value, Line.grade_value >= min_grade_value)

        # Filter secret spots
        if not get_show_secret():
            query = query.filter(Line.secret.is_(False))

        # Handle order
        if order_by and order_direction:
            order_attribute = getattr(Line, order_by)
            if order_by == "name":
                order_attribute = func.lower(order_attribute)
            # Order by Line.id as a tie breaker to prevent duplicate entries in paginate
            query = query.order_by(nullslast(getattr(order_attribute, order_direction)()), Line.id)

        paginated_lines = db.paginate(query, page=int(page), per_page=per_page)

        return jsonify(paginated_lines_schema.dump(paginated_lines)), 200


class GetLine(MethodView):
    def get(self, line_slug):
        """
        Returns a detailed line.
        @param line_slug: Slug of the line to return.
        """
        line: Line = Line.find_by_slug(line_slug)
        check_secret_spot_permission(line)
        return line_schema.dump(line), 200


class CreateLine(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def post(self, area_slug):
        """
        Creates a line.
        """
        area_id = Area.get_id_by_slug(area_slug)
        line_data = parser.parse(line_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        if not cross_validate_grade(line_data["gradeValue"], line_data["gradeScale"], line_data["type"]):
            raise BadRequest("Grade scale, value and line type do not match.")

        new_line: Line = Line()

        new_line.name = line_data["name"].strip()
        new_line.description = line_data["description"]
        new_line.color = line_data.get("color", None)
        new_line.videos = line_data["videos"]
        new_line.type = line_data["type"]
        new_line.grade_scale = line_data["gradeScale"]
        new_line.grade_value = line_data["gradeValue"]
        new_line.starting_position = line_data["startingPosition"]
        new_line.rating = line_data["rating"]
        new_line.secret = line_data["secret"]

        if new_line.grade_value >= 0:
            new_line.fa_year = line_data["faYear"]
            new_line.fa_name = line_data["faName"]
        else:
            new_line.fa_year = None
            new_line.fa_name = None

        new_line.eliminate = line_data["eliminate"]
        new_line.traverse = line_data["traverse"]
        new_line.highball = line_data["highball"]
        new_line.morpho = line_data["morpho"]
        new_line.lowball = line_data["lowball"]
        new_line.no_topout = line_data["noTopout"]
        new_line.bad_dropzone = line_data["badDropzone"]
        new_line.child_friendly = line_data["childFriendly"]

        new_line.roof = line_data["roof"]
        new_line.slab = line_data["slab"]
        new_line.vertical = line_data["vertical"]
        new_line.overhang = line_data["overhang"]

        new_line.athletic = line_data["athletic"]
        new_line.technical = line_data["technical"]
        new_line.endurance = line_data["endurance"]
        new_line.cruxy = line_data["cruxy"]
        new_line.dyno = line_data["dyno"]

        new_line.jugs = line_data["jugs"]
        new_line.sloper = line_data["sloper"]
        new_line.crimps = line_data["crimps"]
        new_line.pockets = line_data["pockets"]
        new_line.pinches = line_data["pinches"]

        new_line.crack = line_data["crack"]
        new_line.dihedral = line_data["dihedral"]
        new_line.compression = line_data["compression"]
        new_line.arete = line_data["arete"]
        new_line.mantle = line_data["mantle"]

        new_line.area_id = area_id
        new_line.created_by_id = created_by.id

        if not new_line.secret:
            set_line_parents_unsecret(new_line)
        db.session.add(new_line)
        db.session.commit()

        return line_schema.dump(new_line), 201


class UpdateLine(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, line_slug):
        """
        Edit a line.
        @param line_slug: Slug of the line to update.
        """
        line_data = parser.parse(line_args, request)
        line: Line = Line.find_by_slug(line_slug)

        if not cross_validate_grade(line_data["gradeValue"], line_data["gradeScale"], line_data["type"]):
            raise BadRequest("Grade scale, value and line type do not match.")

        line.name = line_data["name"].strip()
        line.description = line_data["description"]
        line.color = line_data.get("color", None)
        line.videos = line_data["videos"]
        line.type = line_data["type"]
        line.grade_scale = line_data["gradeScale"]
        line.grade_value = line_data["gradeValue"]
        line.type = line_data["type"]
        line.starting_position = line_data["startingPosition"]
        line.rating = line_data["rating"]
        update_line_secret_property(line, line_data["secret"])

        if line.grade_value >= 0:
            line.fa_year = line_data["faYear"]
            line.fa_name = line_data["faName"]
        else:
            line.fa_year = None
            line.fa_name = None
            if line.ascent_count > 0:
                raise BadRequest("Cannot change a line to a project if it has been ticked!")

        line.eliminate = line_data["eliminate"]
        line.traverse = line_data["traverse"]
        line.highball = line_data["highball"]
        line.lowball = line_data["lowball"]
        line.morpho = line_data["morpho"]
        line.no_topout = line_data["noTopout"]
        line.bad_dropzone = line_data["badDropzone"]
        line.child_friendly = line_data["childFriendly"]

        line.roof = line_data["roof"]
        line.slab = line_data["slab"]
        line.vertical = line_data["vertical"]
        line.overhang = line_data["overhang"]

        line.athletic = line_data["athletic"]
        line.technical = line_data["technical"]
        line.endurance = line_data["endurance"]
        line.cruxy = line_data["cruxy"]
        line.dyno = line_data["dyno"]

        line.jugs = line_data["jugs"]
        line.sloper = line_data["sloper"]
        line.crimps = line_data["crimps"]
        line.pockets = line_data["pockets"]
        line.pinches = line_data["pinches"]

        line.crack = line_data["crack"]
        line.dihedral = line_data["dihedral"]
        line.compression = line_data["compression"]
        line.arete = line_data["arete"]
        line.mantle = line_data["mantle"]

        db.session.add(line)
        db.session.commit()

        return line_schema.dump(line), 200


class DeleteLine(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def delete(self, line_slug):
        """
        Delete a line.
        @param line_slug: Slug of the line to delete.
        """
        line: Line = Line.find_by_slug(line_slug)

        db.session.delete(line)
        db.session.commit()

        return jsonify(None), 204
