from flask import request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from models.user import User


class ArchiveArea(MethodView):
    @jwt_required()
    def post(self, area_slug):
        user: User = User.find_by_email(get_jwt_identity())
        if not user or not user.admin or not user.moderator:
            return Unauthorized('Not enough rights to perform this action')

        area = Area.find_by_slug(area_slug)

        # Collect all lines and images
        lines = []
        topo_images = []

        if area:
            for l in area.lines:
                lines.append(l)
            for ti in area.topo_images:
                topo_images.append(ti)

        for l in lines:
            l.archived = True
            db.session.add(l)

        for ti in topo_images:
            ti.archived = True
            db.session.add(ti)

        # Do not delete archived lines from to-do lists
        # They can be hidden by the frontend and are thus restored if archiving is reverted

        db.session.commit()

        return {"lines": len(lines), "topo_images": len(topo_images)}, 200


class ArchiveSector(MethodView):
    @jwt_required()
    def post(self, sector_slug):
        user: User = User.find_by_email(get_jwt_identity())
        if not user or not user.admin or not user.moderator:
            return Unauthorized('Not enough rights to perform this action')

        sector = Sector.find_by_slug(sector_slug)

        # Collect all lines and images
        lines = []
        topo_images = []

        if sector:
            for a in sector.areas:
                for l in a.lines:
                    lines.append(l)
                for ti in a.topo_images:
                    topo_images.append(ti)

        for l in lines:
            l.archived = True
            db.session.add(l)

        for ti in topo_images:
            ti.archived = True
            db.session.add(ti)

        # Do not delete archived lines from to-do lists
        # They can be hidden by the frontend and are thus restored if archiving is reverted

        db.session.commit()

        return {"lines": len(lines), "topo_images": len(topo_images)}, 200


class ArchiveCrag(MethodView):
    @jwt_required()
    def post(self, crag_slug):
        user: User = User.find_by_email(get_jwt_identity())
        if not user or not user.admin or not user.moderator:
            return Unauthorized('Not enough rights to perform this action')

        crag = Crag.find_by_slug(crag_slug)

        # Collect all lines and images
        lines = []
        topo_images = []

        if crag:
            for s in crag.sectors:
                for a in s.areas:
                    for l in a.lines:
                        lines.append(l)
                    for ti in a.topo_images:
                        topo_images.append(ti)

        for l in lines:
            l.archived = True
            db.session.add(l)

        for ti in topo_images:
            ti.archived = True
            db.session.add(ti)

        # Do not delete archived lines from to-do lists
        # They can be hidden by the frontend and are thus restored if archiving is reverted

        db.session.commit()

        return {"lines": len(lines), "topo_images": len(topo_images)}, 200


