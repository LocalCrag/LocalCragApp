from flask import jsonify, request
from flask.views import MethodView

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from util.auth_session import session_required
from util.condicaster import (
    CondicasterError,
    CondicasterRateLimited,
    conditions_payload,
    resolve_entity,
    search_crags,
    search_locations,
)


class GetCondicasterConditions(MethodView):
    def get(self, level: str, slug: str):
        """Cached CondiCaster conditions for a crag, sector, or area.

        A level without its own crag id uses the nearest ancestor that has one.
        """
        if level not in ("area", "sector", "crag"):
            raise BadRequest("Invalid hierarchy level")

        entity = resolve_entity(level, slug)
        if entity is None:
            raise NotFound()

        return jsonify(conditions_payload(entity)), 200


class SearchCondicasterCrags(MethodView):
    @session_required(moderator=True)
    def get(self):
        """CondiCaster spots by name, or crags near a GPS point."""
        query = (request.args.get("q") or "").strip()
        if query:
            if len(query) < 2 or len(query) > 80:
                raise BadRequest("Invalid q")
            try:
                crags = search_locations(query)
            except CondicasterRateLimited:
                return jsonify({"message": "CONDICASTER_RATE_LIMITED"}), 429
            except CondicasterError:
                return jsonify({"message": "CONDICASTER_UNAVAILABLE"}), 503
            return jsonify({"crags": crags}), 200

        lat = _coordinate(request.args.get("lat"), -90, 90, "lat")
        lon = _coordinate(request.args.get("lon"), -180, 180, "lon")
        try:
            crags = search_crags(lat, lon)
        except CondicasterRateLimited:
            return jsonify({"message": "CONDICASTER_RATE_LIMITED"}), 429
        except CondicasterError:
            return jsonify({"message": "CONDICASTER_UNAVAILABLE"}), 503
        return jsonify({"crags": crags}), 200


def _coordinate(raw: str | None, low: float, high: float, name: str) -> float:
    try:
        value = float(raw)
    except (TypeError, ValueError):
        raise BadRequest(f"Invalid {name}") from None
    if value < low or value > high:
        raise BadRequest(f"Invalid {name}")
    return value
