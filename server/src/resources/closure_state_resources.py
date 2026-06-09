from flask.views import MethodView
from flask_jwt_extended import jwt_required

from marshmallow_schemas.closure_state_schema import closure_state_schema
from models.area import Area
from models.crag import Crag
from models.sector import Sector
from util.security_util import check_auth_claims


class GetCragClosureState(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def get(self, crag_slug):
        """Materialized closure flags for a crag (used by child entity forms)."""
        return closure_state_schema.dump(Crag.find_by_slug(crag_slug)), 200


class GetSectorClosureState(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def get(self, sector_slug):
        """Materialized closure flags for a sector (used by child entity forms)."""
        return closure_state_schema.dump(Sector.find_by_slug(sector_slug)), 200


class GetAreaClosureState(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def get(self, area_slug):
        """Materialized closure flags for an area (used by child entity forms)."""
        return closure_state_schema.dump(Area.find_by_slug(area_slug)), 200
