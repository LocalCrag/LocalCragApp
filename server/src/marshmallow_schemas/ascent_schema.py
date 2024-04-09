from marshmallow import fields, post_dump

from extensions import ma

from marshmallow_schemas.base_entity_schema import BaseEntitySchema


class AscentCragSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    id = fields.String()


class AscentSectorSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    id = fields.String()
    crag = fields.Nested(AscentCragSchema())


class AscentAreaSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    id = fields.String()
    sector = fields.Nested(AscentSectorSchema())


class AscentLineSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    id = fields.String()
    gradeName = fields.String(attribute='grade_name')
    gradeScale = fields.String(attribute='grade_scale')
    area = fields.Nested(AscentAreaSchema())


class AscentSchema(BaseEntitySchema):
    flash = fields.Boolean()
    fa = fields.Boolean()
    soft = fields.Boolean()
    hard = fields.Boolean()
    withKneepad = fields.Boolean(attribute='with_kneepad')
    gradeName = fields.String(attribute='grade_name')
    gradeScale = fields.String(attribute='grade_scale')
    rating = fields.Integer()
    comment = fields.String()
    year = fields.Integer()
    date = fields.Date()
    line = fields.Nested(AscentLineSchema(), allow_none=True)


ascent_schema = AscentSchema()
ascents_schema = AscentSchema(many=True)
