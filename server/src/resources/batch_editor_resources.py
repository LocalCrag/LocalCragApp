from flask import request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.batch_schema import batch_schema
from models.area import Area
from models.enums.history_item_type_enum import HistoryItemTypeEnum
from models.history_item import HistoryItem
from models.line import Line
from models.topo_image import TopoImage
from models.user import User
from util.security_util import check_auth_claims
from util.validators import cross_validate_grade
from webargs_schemas.batch_args import batch_args


class BatchCreateLines(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def post(self, area_slug):
        """
        Creates a number of topo images and lines for an area.
        """
        area = Area.find_by_slug(area_slug)
        batch_data = parser.parse(batch_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        created_topo_images = []
        order_index = TopoImage.find_max_order_index(area.id)
        for index, image_id in enumerate(batch_data["images"], start=1):
            new_topo_image: TopoImage = TopoImage()
            new_topo_image.file_id = image_id
            new_topo_image.area_id = area.id
            new_topo_image.created_by_id = created_by.id
            new_topo_image.order_index = order_index + index

            db.session.add(new_topo_image)

            created_topo_images.append(new_topo_image)

        created_lines = []
        for line_data in batch_data["lines"]:
            if not cross_validate_grade(line_data["authorGradeValue"], batch_data["gradeScale"], batch_data["type"]):
                raise BadRequest("Grade scale, value and line type do not match.")

            new_line: Line = Line()

            new_line.name = line_data["name"].strip()
            new_line.color = line_data.get("color", None)
            new_line.type = batch_data["type"]
            new_line.grade_scale = batch_data["gradeScale"]
            new_line.author_grade_value = line_data["authorGradeValue"]
            new_line.user_grade_value = line_data["authorGradeValue"]
            new_line.starting_position = line_data["startingPosition"]
            new_line.secret = area.secret
            new_line.fa_date = batch_data["faDate"]
            new_line.fa_name = line_data["faName"]

            new_line.area_id = area.id
            new_line.created_by_id = created_by.id

            new_line.closed = area.closed
            new_line.closed_reason = area.closed_reason

            db.session.add(new_line)

            created_lines.append(new_line)

        db.session.commit()

        for line in created_lines:
            HistoryItem.create_history_item(HistoryItemTypeEnum.CREATED, line, created_by)

        return batch_schema.dump({"lines": created_lines, "topo_images": created_topo_images}), 200
