import datetime

from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.instance_statistics_schema import instance_statistics_schema
from models.area import Area
from models.ascent import Ascent
from models.crag import Crag
from models.instance_settings import InstanceSettings
from models.line import Line
from models.sector import Sector
from models.user import User
from util.secret_service import SecretService


class GetCompletion(MethodView):

    def get(self):
        """
        Get the number of lines and ascents for each crag, sector, and area for a user.
        Is used to build a "crag completion" page for a user.
        """
        instance_settings = InstanceSettings.return_it()
        user_id = request.args.get("user_id")
        max_grade_value = request.args.get("max_grade") or None
        min_grade_value = request.args.get("min_grade") or None
        line_type = request.args.get("line_type") or None
        grade_scale = request.args.get("grade_scale") or None
        include_closed = request.args.get("include_closed", False, type=bool)

        if sum(x is None for x in [max_grade_value, min_grade_value]) == 1:
            raise BadRequest("When filtering for grades, a min and max grade is required.")

        try:
            if min_grade_value is not None:
                min_grade_value = int(min_grade_value)
            if max_grade_value is not None:
                max_grade_value = int(max_grade_value)
        except ValueError:
            raise BadRequest("Min and max grade must be valid integers.")

        # Query for all lines and their associated crag, sector, and area
        lines_query = (
            db.session.query(Area.id, Sector.id, Crag.id, Line.id)
            .select_from(Line)
            .join(Area, Line.area_id == Area.id)
            .join(Sector, Area.sector_id == Sector.id)
            .join(Crag, Sector.crag_id == Crag.id)
            .filter(
                Line.author_grade_value >= 0, Line.archived.is_(False)
            )  # Don't include projects in progress or archived lines
            .distinct(Line.id)
        )

        # Filter lines for grades
        if min_grade_value is not None and max_grade_value is not None:
            if instance_settings.display_user_grades:
                lines_query = lines_query.filter(
                    Line.user_grade_value >= min_grade_value, Line.user_grade_value <= max_grade_value
                )
            else:
                lines_query = lines_query.filter(
                    Line.author_grade_value >= min_grade_value, Line.author_grade_value <= max_grade_value
                )

        # Filter secret spots
        lines_query = SecretService.apply_line_filter(lines_query)

        if line_type is not None:
            lines_query = lines_query.filter(Line.type == line_type)
        if grade_scale is not None:
            lines_query = lines_query.filter(Line.grade_scale == grade_scale)
        if not include_closed:
            lines_query = lines_query.filter(
                Line.closed.is_(False),
                Area.closed.is_(False),
                Sector.closed.is_(False),
                Crag.closed.is_(False),
            )

        lines = lines_query.all()

        # Query for all ascents and their associated crag, sector, and area for the user
        ascents_query = (
            db.session.query(Area.id, Sector.id, Crag.id)
            .select_from(Ascent)
            .join(Line, Ascent.line_id == Line.id)
            .join(Area, Line.area_id == Area.id)
            .join(Sector, Area.sector_id == Sector.id)
            .join(Crag, Sector.crag_id == Crag.id)
            .filter(Ascent.created_by_id == user_id)
        )

        # Filter ascents for grades
        if min_grade_value is not None and max_grade_value is not None:
            if instance_settings.display_user_grades:
                ascents_query = ascents_query.filter(
                    Line.user_grade_value >= min_grade_value, Line.user_grade_value <= max_grade_value
                )
            else:
                ascents_query = ascents_query.filter(
                    Line.author_grade_value >= min_grade_value, Line.author_grade_value <= max_grade_value
                )

        # Filter secret spots
        if not SecretService.can_view_secrets():
            ascents_query = ascents_query.filter(Ascent.line.has(secret=False))
        if not include_closed:
            ascents_query = ascents_query.filter(
                Line.closed.is_(False),
                Area.closed.is_(False),
                Sector.closed.is_(False),
                Crag.closed.is_(False),
            )

        ascents = ascents_query.all()

        # Initialize dictionaries to store counts
        crag_counts = {}
        sector_counts = {}
        area_counts = {}

        # Count total lines for each crag, sector, and area
        for line in lines:
            crag_id = str(line[2])  # Crag.id
            sector_id = str(line[1])  # Sector.id
            area_id = str(line[0])  # Area.id
            crag_counts.setdefault(crag_id, {"totalLines": 0, "ascents": 0})["totalLines"] += 1
            sector_counts.setdefault(sector_id, {"totalLines": 0, "ascents": 0})["totalLines"] += 1
            area_counts.setdefault(area_id, {"totalLines": 0, "ascents": 0})["totalLines"] += 1

        # Count ascents for each crag, sector, and area
        for ascent in ascents:
            crag_id = str(ascent[2])  # Crag.id
            sector_id = str(ascent[1])  # Sector.id
            area_id = str(ascent[0])  # Area.id
            if crag_id in crag_counts:
                crag_counts[crag_id]["ascents"] += 1
            if sector_id in sector_counts:
                sector_counts[sector_id]["ascents"] += 1
            if area_id in area_counts:
                area_counts[area_id]["ascents"] += 1

        # Combine the results into a single data structure
        result = {"crags": crag_counts, "sectors": sector_counts, "areas": area_counts}

        return result


def _ascent_list_options():
    return (
        joinedload(Ascent.line).joinedload(Line.area).joinedload(Area.sector).joinedload(Sector.crag),
        joinedload(Ascent.created_by),
    )


class GetInstanceStatistics(MethodView):
    """Public instance-wide stats for the sidebar."""

    def get(self):
        instance_settings = InstanceSettings.return_it()
        display_user_grades = bool(instance_settings.display_user_grades)
        grade_col = Line.user_grade_value if display_user_grades else Line.author_grade_value

        today = datetime.date.today()
        month_ago = today - datetime.timedelta(days=30)
        week_ago = today - datetime.timedelta(days=7)

        ascent_base = (
            db.session.query(Ascent)
            .join(Line, Ascent.line_id == Line.id)
            .filter(Line.archived.is_(False), Line.author_grade_value >= 0)
        )
        ascent_base = SecretService.apply_line_filter(ascent_base)

        line_base = db.session.query(Line).filter(Line.archived.is_(False), Line.author_grade_value >= 0)
        line_base = SecretService.apply_line_filter(line_base)

        hardest_ascents_last_month = (
            ascent_base.options(*_ascent_list_options())
            .filter(Ascent.ascent_date >= month_ago)
            .order_by(grade_col.desc(), Ascent.id.desc())
            .limit(5)
            .all()
        )

        latest_first_ascents = (
            ascent_base.options(*_ascent_list_options())
            .filter(Ascent.fa.is_(True))
            .order_by(Ascent.time_created.desc(), Ascent.id.desc())
            .limit(5)
            .all()
        )

        total_ascents = ascent_base.with_entities(func.count(Ascent.id)).scalar() or 0
        ascents_last_week = (
            ascent_base.filter(Ascent.ascent_date >= week_ago).with_entities(func.count(Ascent.id)).scalar() or 0
        )
        total_lines = line_base.with_entities(func.count(Line.id)).scalar() or 0
        total_users = db.session.query(func.count(User.id)).filter(User.activated.is_(True)).scalar() or 0

        payload = {
            "totals": {
                "total_ascents": total_ascents,
                "ascents_last_week": ascents_last_week,
                "total_lines": total_lines,
                "total_users": total_users,
            },
            "hardest_ascents_last_month": hardest_ascents_last_month,
            "latest_first_ascents": latest_first_ascents,
        }

        return jsonify(instance_statistics_schema.dump(payload)), 200
