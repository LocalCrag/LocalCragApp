import os
import pathlib
import uuid

from PIL import Image
from cairosvg import svg2png
from flask import request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.media_schema import media_schema
from models.user import User
from permission_system.check_user_not_locked_or_deleted_decorator import check_user_not_locked_or_deleted
from uploader.media_upload_handler import handle_image_upload
from util.image_util import trim
from webargs_schemas.media_args import svg_to_png_args


class SvgToPng(MethodView):  # pragma: no cover

    @jwt_required()
    @check_user_not_locked_or_deleted()
    def post(self):
        """
        Converts an SVG string to a PNG media.
        """
        svg_data = parser.parse(svg_to_png_args, request)

        created_by = User.find_by_email(get_jwt_identity(), True)

        file_uuid = str(uuid.uuid4())
        prefix = ''
        if svg_data['prefix']:
            prefix = svg_data['prefix'] + '_'
        filename = '{}{}.png'.format(prefix, file_uuid)
        temp_folder = os.path.join('uploads/tmp', file_uuid)
        pathlib.Path(temp_folder).mkdir(parents=True, exist_ok=True)
        temp_path = os.path.join(temp_folder, filename)

        try:
            svg2png(bytestring=svg_data['svg'].encode('utf-8'), write_to=temp_path)
        except:
            raise BadRequest('SVG conversion failed. Probably the sent SVG contained errors.')

        img = Image.open(temp_path)
        img_trimmed = trim(img)
        if not img_trimmed:
            raise BadRequest('Cannot convert Null-SVG: Image was empty after trimming whitespace.',
                             'TRIED_SAVING_EMPTY_SVG')
        img_trimmed.save(temp_path)

        new_media = handle_image_upload(temp_path, filename, file_uuid)
        new_media.created_by_id = created_by.id

        db.session.add(new_media)
        db.session.commit()
        return media_schema.dump(new_media), 201
