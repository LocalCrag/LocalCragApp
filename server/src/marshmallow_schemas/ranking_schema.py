from marshmallow import fields

from extensions import ma
from marshmallow_schemas.user_schema import user_min_schema


class RankingSchema(ma.SQLAlchemySchema):
    user = fields.Nested(user_min_schema)
    top10 = fields.Integer(attribute='top_10')
    top10Exponential = fields.Integer(attribute='top_10_exponential')
    top25 = fields.Integer(attribute='top_25')
    top25Exponential = fields.Integer(attribute='top_25_exponential')
    top10Fa = fields.Integer(attribute='top_10_fa')
    top10FaExponential = fields.Integer(attribute='top_10_fa_exponential')
    total = fields.Integer(attribute='total')
    totalCount = fields.Integer(attribute='total_count')
    totalExponential = fields.Integer(attribute='total_exponential')
    totalFa = fields.Integer(attribute='total_fa')
    totalFaCount = fields.Integer(attribute='total_fa_count')
    totalFaExponential = fields.Integer(attribute='total_fa_exponential')


ranking_schema = RankingSchema(many=True)
