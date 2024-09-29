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
from webargs_schemas.archive_args import archive_args


class UpdateArchived(MethodView):
    @jwt_required()
    def post(self):
        user: User = User.find_by_email(get_jwt_identity())
        if not user or not user.admin or not user.moderator:
            return Unauthorized('Not enough rights to perform this action')

        archive_data = parser.parse(archive_args, request)

        # Check validity of complete request to prevent partial application
        line = Line.find_by_slug(archive_data['line']) if archive_data.get('line', None) else None
        area = Area.find_by_slug(archive_data['area']) if archive_data.get('area', None) else None
        sector = Sector.find_by_slug(archive_data['sector']) if archive_data.get('sector', None) else None
        crag = Crag.find_by_slug(archive_data['crag']) if archive_data.get('crag', None) else None

        new_archive_status = archive_data['archived']

        # Collect all lines and images
        lines = []
        topo_images = []

        if line:
            lines.append(line)

        if area:
            for l in area.lines:
                lines.append(l)
            for ti in area.topo_images:
                topo_images.append(ti)

        if sector:
            for a in sector.areas:
                for l in a.lines:
                    lines.append(l)
                for ti in a.topo_images:
                    topo_images.append(ti)

        if crag:
            for s in crag.sectors:
                for a in s.areas:
                    for l in a.lines:
                        lines.append(l)
                    for ti in a.topo_images:
                        topo_images.append(ti)

        for l in lines:
            l.archived = new_archive_status
            db.session.add(l)

        for ti in topo_images:
            ti.archived = new_archive_status
            db.session.add(ti)

        # Do not delete archived lines from to-do lists
        # They can be hidden by the frontend and are thus restored if archiving is reverted

        db.session.commit()

        return {"lines": len(lines), "topo_images": len(topo_images)}, 200


