from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy import false

from extensions import db
from marshmallow_schemas.history_schema import paginated_history_schema
from models.area import Area
from models.crag import Crag
from models.history_item import HistoryItem
from models.line import Line
from models.sector import Sector
from util.secret_spots_auth import get_show_secret


class GetHistory(MethodView):

    def get(self):
        """
        Returns all history items in a paginated manner.
        """
        page = request.args.get("page") or 1
        per_page = request.args.get("per_page") or None
        if per_page is not None:
            per_page = int(per_page)

        query = HistoryItem.query

        # Filter secret spots
        if not get_show_secret():
            query = (
                query.outerjoin(Line, (HistoryItem.object_id == Line.id) & (HistoryItem.object_type == "Line"))
                .outerjoin(Area, (HistoryItem.object_id == Line.id) & (HistoryItem.object_type == "Area"))
                .outerjoin(Sector, (HistoryItem.object_id == Line.id) & (HistoryItem.object_type == "Sector"))
                .outerjoin(Crag, (HistoryItem.object_id == Line.id) & (HistoryItem.object_type == "Crag"))
                .filter(
                    (HistoryItem.object_type == "Line") & (Line.secret == false())
                    | (HistoryItem.object_type == "Area") & (Area.secret == false())
                    | (HistoryItem.object_type == "Sector") & (Sector.secret == false())
                    | (HistoryItem.object_type == "Crag") & (Crag.secret == false())
                )
            )

        # Handle order
        query = query.order_by(HistoryItem.time_created.desc())

        # Paginate
        paginated_lines = db.paginate(query, page=int(page), per_page=per_page)

        return jsonify(paginated_history_schema.dump(paginated_lines)), 200
