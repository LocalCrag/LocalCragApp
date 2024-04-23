from flask import request, jsonify
from flask.views import MethodView

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.ranking_schema import ranking_schema
from models.enums.line_type_enum import LineTypeEnum
from models.ranking import Ranking


class GetRanking(MethodView):

    def get(self):
        line_type = request.args.get('line_type')
        crag_id = request.args.get('crag_id')
        sector_id = request.args.get('sector_id')

        if line_type not in set(item.value for item in LineTypeEnum):
            raise BadRequest('Invalid line type')

        if crag_id and sector_id:
            raise BadRequest('Can either fetch crag OR sector OR global ranking.')

        query = db.session.query(Ranking)
        query = query.filter(Ranking.type == line_type)
        query = query.filter(Ranking.crag_id == crag_id)
        query = query.filter(Ranking.sector_id == sector_id)
        rankings = query.all()

        return jsonify(ranking_schema.dump(rankings)), 200
