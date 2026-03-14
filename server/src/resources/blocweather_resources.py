from flask import jsonify
from flask.views import MethodView

from error_handling.http_exceptions.bad_request import BadRequest
from models.area import Area
from models.crag import Crag
from models.sector import Sector


class GetNearestBlocweatherUrl(MethodView):
    def get(self, level: str, slug: str):
        """Return the nearest blocweather url for a given hierarchy level.

        Levels:
        - area: check area.blocweather_url, then sector, then crag
        - sector: check sector.blocweather_url, then crag
        - crag: check crag.blocweather_url

        Response:
            {"blocweatherUrl": <str|null>,}
        """

        if level == "area":
            area: Area = Area.find_by_slug(slug)
            sector: Sector = area.sector
            crag: Crag = sector.crag
            candidates = [
                area.blocweather_url,
                sector.blocweather_url,
                crag.blocweather_url,
            ]
        elif level == "sector":
            sector: Sector = Sector.find_by_slug(slug)
            crag: Crag = sector.crag
            candidates = [
                sector.blocweather_url,
                crag.blocweather_url,
            ]
        elif level == "crag":
            crag: Crag = Crag.find_by_slug(slug)
            candidates = [crag.blocweather_url]
        else:
            raise BadRequest("Invalid hierarchy level")

        for url in candidates:
            if url is not None:
                return jsonify({"blocweatherUrl": url}), 200

        return jsonify({"blocweatherUrl": None}), 200
