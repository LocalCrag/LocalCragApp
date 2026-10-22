from flask import jsonify, request
from flask.views import MethodView
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from models.area import Area
from models.crag import Crag
from models.enums.archive_type_enum import ArchiveTypeEnum
from models.enums.publication_status_enum import PublicationStatusEnum
from models.line import Line
from models.sector import Sector
from models.topo_image import TopoImage
from util.archive import (
    cascade_topo_image_archived,
    set_area_archived,
    set_crag_archived,
    set_sector_archived,
)
from util.auth_session import get_current_user, session_required
from util.gym_mode import is_gym_mode
from webargs_schemas.archive_args import archive_args


def _set_line_or_image_archived(entity, value: bool, label: str):
    if value:
        if entity.publication_status != PublicationStatusEnum.PUBLISHED:
            raise BadRequest(f"Only published {label} can be archived.")
        entity.publication_status = PublicationStatusEnum.ARCHIVED
        return
    if entity.publication_status != PublicationStatusEnum.ARCHIVED:
        raise BadRequest(f"Only archived {label} can be restored.")
    entity.publication_status = PublicationStatusEnum.PUBLISHED


class SetArchived(MethodView):
    @session_required(moderator=True)
    @is_gym_mode(True)
    def put(self):
        """
        Adjusts the archive status
        """
        archive_data = parser.parse(archive_args, request)
        actor = get_current_user()

        if archive_data["type"] == ArchiveTypeEnum.LINE:
            line = Line.find_by_slug(archive_data["slug"])
            _set_line_or_image_archived(line, archive_data["value"], "lines")
            db.session.add(line)
            db.session.commit()
        elif archive_data["type"] == ArchiveTypeEnum.TOPO_IMAGE:
            # TopoImages don't have a slug, so use the id as workaround
            topo_image = TopoImage.find_by_id(archive_data["slug"])
            _set_line_or_image_archived(topo_image, archive_data["value"], "topo images")
            db.session.add(topo_image)
            # Cascade only when requested, so an image can be replaced without archiving its lines.
            if archive_data["cascade"]:
                cascade_topo_image_archived(topo_image, actor)
            db.session.commit()
        elif archive_data["type"] == ArchiveTypeEnum.AREA:
            area = Area.find_by_slug(archive_data["slug"])
            set_area_archived(area, actor, area.name, archive_data["value"])
            db.session.commit()
        elif archive_data["type"] == ArchiveTypeEnum.SECTOR:
            sector = Sector.find_by_slug(archive_data["slug"])
            set_sector_archived(sector, actor, archive_data["value"])
            db.session.commit()
        elif archive_data["type"] == ArchiveTypeEnum.CRAG:
            crag = Crag.find_by_slug(archive_data["slug"])
            set_crag_archived(crag, actor, archive_data["value"])
            db.session.commit()

        return jsonify({}), 204
