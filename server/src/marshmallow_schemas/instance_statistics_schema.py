from marshmallow import fields

from extensions import ma
from marshmallow_schemas.ascent_schema import AscentSchema


class InstanceStatisticsTotalsSchema(ma.Schema):
    totalAscents = fields.Integer(attribute="total_ascents")
    ascentsLastWeek = fields.Integer(attribute="ascents_last_week")
    totalLines = fields.Integer(attribute="total_lines")
    totalUsers = fields.Integer(attribute="total_users")


class InstanceStatisticsSchema(ma.Schema):
    totals = fields.Nested(InstanceStatisticsTotalsSchema())
    hardestAscentsLastMonth = fields.List(fields.Nested(AscentSchema()), attribute="hardest_ascents_last_month")
    latestFirstAscents = fields.List(fields.Nested(AscentSchema()), attribute="latest_first_ascents")


instance_statistics_schema = InstanceStatisticsSchema()
