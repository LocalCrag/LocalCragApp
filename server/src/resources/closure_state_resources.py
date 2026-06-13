from flask.views import MethodView

from marshmallow_schemas.closure_state_schema import closure_state_schema
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from util.security_util import check_secret_spot_permission


class GetCragClosureState(MethodView):
    def get(self, crag_slug):
        """Materialized closure state for a crag (lazy-loaded from closed tags)."""
        crag = Crag.find_by_slug(crag_slug)
        check_secret_spot_permission(crag)
        return closure_state_schema.dump(crag), 200


class GetSectorClosureState(MethodView):
    def get(self, sector_slug):
        """Materialized closure state for a sector (lazy-loaded from closed tags)."""
        sector = Sector.find_by_slug(sector_slug)
        check_secret_spot_permission(sector)
        return closure_state_schema.dump(sector), 200


class GetAreaClosureState(MethodView):
    def get(self, area_slug):
        """Materialized closure state for an area (lazy-loaded from closed tags)."""
        area = Area.find_by_slug(area_slug)
        check_secret_spot_permission(area)
        return closure_state_schema.dump(area), 200


class GetLineClosureState(MethodView):
    def get(self, line_slug):
        """Materialized closure state for a line (lazy-loaded from closed tags)."""
        line = Line.find_by_slug(line_slug)
        check_secret_spot_permission(line)
        return closure_state_schema.dump(line), 200
