from flask import request
from flask.views import MethodView
from sqlalchemy import false

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from models.area import Area
from models.ascent import Ascent
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from util.secret_spots_auth import get_show_secret


class GetCompletion(MethodView):

    def get(self):
        """
        Get the number of lines and ascents for each crag, sector, and area for a user.
        Is used to build a "crag completion" page for a user.
        """

        # TODO @BlobbyBob Add filter for archived, update grade filter

        user_id = request.args.get("user_id")
        max_grade_value = request.args.get("max_grade") or None
        min_grade_value = request.args.get("min_grade") or None

        if sum(x is None for x in [max_grade_value, min_grade_value]) == 1:
            raise BadRequest("When filtering for grades, a min and max grade is required.")

        # Query for all lines and their associated crag, sector, and area
        lines_query = (
            db.session.query(Area.id, Sector.id, Crag.id, Line.id)
            .select_from(Line)
            .join(Area, Line.area_id == Area.id)
            .join(Sector, Area.sector_id == Sector.id)
            .join(Crag, Sector.crag_id == Crag.id)
            .filter(Line.grade_value >= 0)  # Don't include projects in progress
            .distinct(Line.id)
        )

        # Filter lines for grades
        if min_grade_value is not None and max_grade_value is not None:
            lines_query = lines_query.filter(Line.grade_value >= min_grade_value, Line.grade_value <= max_grade_value)

        # Filter secret spots
        if not get_show_secret():
            lines_query = lines_query.filter(Line.secret == false())

        lines = lines_query.all()

        # Query for all ascents and their associated crag, sector, and area for the user
        ascents_query = db.session.query(Ascent.area_id, Ascent.sector_id, Ascent.crag_id).filter(
            Ascent.created_by_id == user_id
        )

        # Filter ascents for grades
        if min_grade_value is not None and max_grade_value is not None:
            ascents_query = ascents_query.join(Ascent.line).filter(
                Line.grade_value >= min_grade_value, Line.grade_value <= max_grade_value
            )

        # Filter secret spots
        if not get_show_secret():
            ascents_query = ascents_query.filter(Ascent.line.has(secret=False))

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
