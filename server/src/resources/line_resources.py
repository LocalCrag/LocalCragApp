from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request
from sqlalchemy import func, nullslast, select
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.line_schema import (
    line_schema,
    lines_schema,
    paginated_lines_schema,
)
from marshmallow_schemas.search_schema import line_search_schema
from models.area import Area
from models.ascent import Ascent
from models.crag import Crag
from models.enums.history_item_type_enum import HistoryItemTypeEnum
from models.history_item import HistoryItem
from models.instance_settings import InstanceSettings
from models.line import Line
from models.line_path import LinePath
from models.sector import Sector
from models.topo_image import TopoImage
from models.user import User
from util.line_list_query_args import parse_line_list_filters
from util.line_list_sql_filters import apply_get_lines_advanced_filters
from util.propagating_boolean_attrs import (
    set_line_parents_false,
    update_line_propagating_boolean_attr,
)
from util.scheduled_closure import (
    apply_closable_configuration,
    finalize_closable_save,
    request_closure_materialization,
)
from util.secret_spots_auth import get_show_secret
from util.security_util import check_auth_claims, check_secret_spot_permission
from util.validators import cross_validate_grade
from webargs_schemas.line_args import line_args
from webargs_schemas.move_args import move_line_args


class MoveLine(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, line_slug):
        """
        Move a line to a different area.
        """
        payload = parser.parse(move_line_args, request)
        target_area_id = payload["areaId"]

        line: Line = Line.find_by_slug(line_slug)
        old_area_id = line.area_id
        target_area_id = Area.find_by_id(target_area_id).id

        if target_area_id == old_area_id:
            return line_schema.dump(line), 200

        # Moving a line invalidates existing line paths (they belong to topo images of the old area).
        # Delete all LinePath entries for this line.
        LinePath.query.filter_by(line_id=line.id).delete(synchronize_session=False)

        line.area_id = target_area_id

        # Secret handling: a public line moved into a secret area becomes secret.
        # Closure flags are recomputed after commit via request_closure_materialization().
        target_area: Area = Area.find_by_id(target_area_id)
        if target_area.secret and not line.secret:
            update_line_propagating_boolean_attr(line, True, "secret")

        db.session.add(line)
        db.session.commit()
        request_closure_materialization()
        return line_search_schema.dump(line), 200


def _primary_topo_sort_subqueries():
    """
    Sort keys for the line's primary topo path (lowest order_index_for_line), matching client topo order.
    """
    topo_image_order = (
        select(TopoImage.order_index)
        .select_from(LinePath)
        .join(TopoImage, LinePath.topo_image_id == TopoImage.id)
        .where(LinePath.line_id == Line.id)
        .order_by(LinePath.order_index_for_line.asc())
        .limit(1)
        .correlate(Line)
        .scalar_subquery()
    )
    line_path_order = (
        select(LinePath.order_index)
        .where(LinePath.line_id == Line.id)
        .order_by(LinePath.order_index_for_line.asc())
        .limit(1)
        .correlate(Line)
        .scalar_subquery()
    )
    return topo_image_order, line_path_order


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
        Returns all lines in a paginated manner.
        """
        instance_settings = InstanceSettings.return_it()
        list_filters = parse_line_list_filters(request)

        crag_slug = request.args.get("crag_slug")
        sector_slug = request.args.get("sector_slug")
        area_slug = request.args.get("area_slug")
        page = request.args.get("page") or 1
        per_page = request.args.get("per_page") or None
        if per_page is not None:
            per_page = int(per_page)
        order_by = request.args.get("order_by") or None
        order_direction = request.args.get("order_direction") or "asc"
        archived = request.args.get("archived", False, type=bool)  # default: hide archived lines

        if order_by not in [
            "grade_value",
            "name",
            "rating",
            "ascent_count",
            "time_created",
            "topo_position",
            None,
        ] or order_direction not in [
            "asc",
            "desc",
        ]:
            raise BadRequest("Invalid order by query parameters")

        # Filter for crag, sector or area
        query = select(Line).filter(Line.archived == archived).join(Area).join(Sector).join(Crag)
        if crag_slug:
            query = query.filter(Crag.slug == crag_slug)
        if sector_slug:
            query = query.filter(Sector.slug == sector_slug)
        if area_slug:
            query = query.filter(Area.slug == area_slug)
        # Filter secret spots
        if not get_show_secret():
            query = query.filter(Line.secret.is_(False))

        user_for_filters = None
        if list_filters.climb_filter != "any":
            verify_jwt_in_request(optional=True)
            identity = get_jwt_identity()
            user_for_filters = User.find_by_email(identity) if identity else None

        query = apply_get_lines_advanced_filters(query, list_filters, instance_settings, user_for_filters)

        # Handle order
        if order_by and order_direction:
            if order_by == "topo_position":
                topo_image_order, line_path_order = _primary_topo_sort_subqueries()
                # UI asc/desc is inverted vs topo guide order (lower order_index = later in list).
                topo_sort_direction = "desc" if order_direction == "asc" else "asc"
                # Topo indices are scoped per area; parent order_index breaks ties across areas/sectors/crags.
                query = query.order_by(
                    nullslast(getattr(Crag.order_index, topo_sort_direction)()),
                    nullslast(getattr(Sector.order_index, topo_sort_direction)()),
                    nullslast(getattr(Area.order_index, topo_sort_direction)()),
                    nullslast(getattr(topo_image_order, topo_sort_direction)()),
                    nullslast(getattr(line_path_order, topo_sort_direction)()),
                    Line.id,
                )
            else:
                if order_by == "grade_value":
                    order_by = "user_grade_value" if instance_settings.display_user_grades else "author_grade_value"
                elif order_by == "rating":
                    order_by = "user_rating" if instance_settings.display_user_ratings else "author_rating"
                if order_by == "ascent_count":
                    order_attribute = select(func.count(Ascent.id)).where(Ascent.line_id == Line.id).scalar_subquery()
                else:
                    order_attribute = getattr(Line, order_by)
                if order_by == "name":
                    order_attribute = func.lower(order_attribute)
                # Order by Line.id as a tie-breaker to prevent duplicate entries in paginate
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

        if not cross_validate_grade(line_data["authorGradeValue"], line_data["gradeScale"], line_data["type"]):
            raise BadRequest("Grade scale, value and line type do not match.")

        new_line: Line = Line()

        new_line.name = line_data["name"].strip()
        new_line.description = line_data["description"]
        new_line.color = line_data.get("color", None)
        new_line.videos = line_data["videos"]
        new_line.type = line_data["type"]
        new_line.grade_scale = line_data["gradeScale"]
        new_line.author_grade_value = line_data["authorGradeValue"]
        new_line.user_grade_value = line_data["authorGradeValue"]
        new_line.starting_position = line_data["startingPosition"]
        new_line.author_rating = line_data["authorRating"]
        new_line.user_rating = line_data["authorRating"]
        new_line.secret = line_data["secret"]

        if new_line.author_grade_value >= 0:
            if line_data["faYear"] and line_data["faDate"]:
                raise BadRequest("Both faYear and faDate cannot be provided. One must be None.")
            new_line.fa_year = line_data["faYear"]
            new_line.fa_date = line_data["faDate"]
            new_line.fa_name = line_data["faName"]
        else:
            new_line.fa_year = None
            new_line.fa_name = None
            new_line.fa_date = None

        new_line.routesetter = line_data["routesetter"]
        new_line.set_date = line_data["setDate"]

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

        apply_closable_configuration(new_line, line_data, "line_id")

        if not new_line.secret:
            set_line_parents_false(new_line, "secret")
        db.session.commit()
        finalize_closable_save(new_line)

        HistoryItem.create_history_item(HistoryItemTypeEnum.CREATED, new_line, created_by)

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

        if not cross_validate_grade(line_data["authorGradeValue"], line_data["gradeScale"], line_data["type"]):
            raise BadRequest("Grade scale, value and line type do not match.")

        line.name = line_data["name"].strip()
        line.description = line_data["description"]
        line.color = line_data.get("color", None)
        line.videos = line_data["videos"]
        line.type = line_data["type"]
        line.grade_scale = line_data["gradeScale"]
        HistoryItem.create_history_item(
            HistoryItemTypeEnum.UPDATED,
            line,
            User.find_by_email(get_jwt_identity()),
            old_value=line.author_grade_value,
            new_value=line_data["authorGradeValue"],
            property_name="grade_value",
        )
        line.author_grade_value = line_data["authorGradeValue"]
        line.type = line_data["type"]
        line.starting_position = line_data["startingPosition"]
        line.author_rating = line_data["authorRating"]
        update_line_propagating_boolean_attr(line, line_data["secret"], "secret")
        apply_closable_configuration(line, line_data, "line_id")

        if line.author_grade_value >= 0:
            if line_data["faYear"] and line_data["faDate"]:
                raise BadRequest("Both faYear and faDate cannot be provided. One must be None.")
            line.fa_year = line_data["faYear"]
            line.fa_name = line_data["faName"]
            line.fa_date = line_data["faDate"]
        else:
            line.fa_year = None
            line.fa_name = None
            line.fa_date = None
            if line.ascent_count > 0:
                raise BadRequest("Cannot change a line to a project if it has been ticked!")

        line.routesetter = line_data["routesetter"]
        line.set_date = line_data["setDate"]

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
        finalize_closable_save(line)

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
