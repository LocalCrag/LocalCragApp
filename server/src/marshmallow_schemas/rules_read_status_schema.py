from marshmallow import fields

from extensions import ma


class RulesReadStatusSchema(ma.SQLAlchemySchema):
    entityType = fields.String(attribute="entity_type")
    entityId = fields.String(attribute="entity_id")
    readAt = fields.DateTime(attribute="read_at")
    acknowledgedRulesUpdatedAt = fields.DateTime(
        attribute="acknowledged_rules_updated_at",
        allow_none=True,
    )


rules_read_status_schema = RulesReadStatusSchema()
rules_read_status_list_schema = RulesReadStatusSchema(many=True)
