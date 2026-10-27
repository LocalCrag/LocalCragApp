from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy.orm import joinedload

from error_handling.http_exceptions.bad_request import BadRequest
from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from marshmallow_schemas.user_schema import user_min_with_avatar_schema
from models.area import Area
from models.crag import Crag
from models.instance_settings import InstanceSettings
from models.sector import Sector
from models.user import User
from util.auth_session import session_required
from util.secret_service import SecretService
from util.topo_quality_data import load_quality_snapshot
from util.topo_quality_score import build_detail, build_tree

RESTART_CONFIRMATION = "RESTART"


def _exclude_secret() -> bool:
    raw = (request.args.get("excludeSecret") or "").lower()
    requested = raw in ("1", "true", "yes")
    if not SecretService.can_view_secrets():
        return True
    return requested


def _snapshot():
    gym = bool(InstanceSettings.return_it().gym_mode)
    return load_quality_snapshot(_exclude_secret(), gym), gym


class GetTopoQuality(MethodView):
    @session_required(member=True)
    def get(self):
        (region_name, spots, lines, topos), gym = _snapshot()
        return jsonify(build_tree(region_name, spots, lines, topos, gym))


class GetTopoQualityDetail(MethodView):
    @session_required(member=True)
    def get(self, crag_slug=None, sector_slug=None, area_slug=None):
        (region_name, spots, lines, topos), gym = _snapshot()
        if area_slug is not None:
            level, target_id = "area", _area_id(crag_slug, sector_slug, area_slug)
        elif sector_slug is not None:
            level, target_id = "sector", _sector_id(crag_slug, sector_slug)
        elif crag_slug is not None:
            level, target_id = "crag", _crag_id(crag_slug)
        else:
            level, target_id = "region", ""
        if level != "region" and not target_id:
            raise NotFound()
        payload = build_detail(level, target_id, region_name, spots, lines, topos, gym)
        if payload is None:
            raise NotFound()
        return jsonify(payload)


class GetTopoQualityRanking(MethodView):
    @session_required(moderator=True)
    def get(self):
        users = (
            User.query.options(joinedload(User.avatar))
            .filter(User.moderator.is_(True), User.topo_points != 0)
            .order_by(User.topo_points.desc(), User.firstname.asc(), User.lastname.asc())
            .all()
        )
        ranking = []
        last_points = None
        rank = 0
        for index, user in enumerate(users, start=1):
            if user.topo_points != last_points:
                rank = index
                last_points = user.topo_points
            ranking.append(
                {
                    "rank": rank,
                    "points": user.topo_points,
                    "user": user_min_with_avatar_schema.dump(user),
                }
            )
        return jsonify(ranking)


class RestartTopoQuality(MethodView):
    @session_required(admin=True)
    def post(self):
        body = request.get_json(silent=True) or {}
        if body.get("confirmation") != RESTART_CONFIRMATION:
            raise BadRequest("Type RESTART to confirm.")
        db.session.query(User).update({User.topo_points: 0})
        db.session.commit()
        return jsonify({"restarted": True})


def _crag_id(slug: str):
    crag = Crag.query.filter_by(slug=slug).first()
    if crag is None:
        return ""
    return str(crag.id)


def _sector_id(crag_slug: str, sector_slug: str):
    crag = Crag.query.filter_by(slug=crag_slug).first()
    if crag is None:
        return ""
    sector = Sector.query.filter_by(slug=sector_slug, crag_id=crag.id).first()
    if sector is None:
        return ""
    return str(sector.id)


def _area_id(crag_slug: str, sector_slug: str, area_slug: str):
    crag = Crag.query.filter_by(slug=crag_slug).first()
    if crag is None:
        return ""
    sector = Sector.query.filter_by(slug=sector_slug, crag_id=crag.id).first()
    if sector is None:
        return ""
    area = Area.query.filter_by(slug=area_slug, sector_id=sector.id).first()
    if area is None:
        return ""
    return str(area.id)
