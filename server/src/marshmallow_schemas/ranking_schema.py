from marshmallow import fields

from extensions import ma
from marshmallow_schemas.user_schema import user_min_schema


class RankingSchema(ma.SQLAlchemySchema):
    user = fields.Nested(user_min_schema)
    top10 = fields.Integer(attribute='top_10')
    top50 = fields.Integer(attribute='top_50')
    totalCount = fields.Integer(attribute='total_count')


ranking_schema = RankingSchema(many=True)
