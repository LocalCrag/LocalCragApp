from marshmallow import fields

from extensions import ma
from marshmallow_schemas.area_schema import AscentAndTodoAreaSchema
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.crag_schema import AscentAndTodoCragSchema
from marshmallow_schemas.line_schema import AscentAndTodoLineSchema
from marshmallow_schemas.sector_schema import AscentAndTodoSectorSchema


class AscentSchema(BaseEntitySchema):
    flash = fields.Boolean()
    fa = fields.Boolean()
    soft = fields.Boolean()
    hard = fields.Boolean()
    withKneepad = fields.Boolean(attribute="with_kneepad")
    gradeName = fields.String(attribute="grade_name")
    gradeScale = fields.String(attribute="grade_scale")
    rating = fields.Integer()
    comment = fields.String()
    year = fields.Integer()
    date = fields.Date()
    line = fields.Nested(AscentAndTodoLineSchema())
    crag = fields.Nested(AscentAndTodoCragSchema())
    sector = fields.Nested(AscentAndTodoSectorSchema())
    area = fields.Nested(AscentAndTodoAreaSchema())


class PaginatedAscentsSchema(ma.SQLAlchemySchema):
    items = fields.List(fields.Nested(AscentSchema()))
    hasNext = fields.Boolean(attribute="has_next")


ascent_schema = AscentSchema()
paginated_ascents_schema = PaginatedAscentsSchema()
ascents_schema = AscentSchema(many=True)
