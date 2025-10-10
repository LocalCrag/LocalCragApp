from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from webargs.flaskparser import parser

from extensions import db
from models.area import Area
from models.crag import Crag
from models.enums.archive_type_enum import ArchiveTypeEnum
from models.line import Line
from models.sector import Sector
from models.topo_image import TopoImage
from util.archive import (
    cascade_topo_image_archived,
    set_area_archived,
    set_crag_archived,
    set_sector_archived,
)
from util.gym_mode import is_gym_mode
from util.security_util import check_auth_claims
from webargs_schemas.archive_args import archive_args, cross_validate_archive_args


class SetArchived(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    @is_gym_mode(True)
    def put(self):
        """
        Adjusts the archive status
        """
        archive_data = parser.parse(archive_args, request, validate=cross_validate_archive_args)

        if archive_data["type"] == ArchiveTypeEnum.LINE:
            line = Line.find_by_slug(archive_data["slug"])
            line.archived = archive_data["value"]
            db.session.add(line)
            db.session.commit()
        elif archive_data["type"] == ArchiveTypeEnum.TOPO_IMAGE:
            # TopoImages don't have a slug, so use the id as workaround
            topo_image = TopoImage.find_by_id(archive_data["slug"])
            topo_image.archived = archive_data["value"]
            db.session.add(topo_image)
            # Areas, Sectors and Crags archive all lines and topo images below them by default
            # For archived topo images we only do this by condition to allow replacing an image while keeping the lines
            if archive_data["cascade"]:
                cascade_topo_image_archived(topo_image)
            db.session.commit()
        elif archive_data["type"] == ArchiveTypeEnum.AREA:
            area = Area.find_by_slug(archive_data["slug"])
            set_area_archived(area)
            db.session.commit()
        elif archive_data["type"] == ArchiveTypeEnum.SECTOR:
            sector = Sector.find_by_slug(archive_data["slug"])
            set_sector_archived(sector)
            db.session.commit()
        elif archive_data["type"] == ArchiveTypeEnum.CRAG:
            crag = Crag.find_by_slug(archive_data["slug"])
            set_crag_archived(crag)
            db.session.commit()

        return jsonify({}), 204
