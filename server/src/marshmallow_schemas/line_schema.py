from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from marshmallow_schemas.base_entity_schema import BaseEntityMinSchema
from models.enums.line_type_enum import LineTypeEnum
from models.enums.starting_position_enum import StartingPositionEnum


class AscentAndTodoLineSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    id = fields.String()
    type = EnumField(LineTypeEnum, by_value=True)
    gradeValue = fields.Integer(attribute="grade_value")
    gradeScale = fields.String(attribute="grade_scale")


class LineSchemaMin(BaseEntityMinSchema):
    name = fields.String()
    slug = fields.String()
    color = fields.String()
    type = EnumField(LineTypeEnum, by_value=True)
    gradeValue = fields.Integer(attribute="grade_value")
    gradeScale = fields.String(attribute="grade_scale")
    archived = fields.Boolean()


class LineSchema(BaseEntityMinSchema):
    name = fields.String()
    description = fields.String()
    slug = fields.String()
    color = fields.String()
    areaSlug = fields.String(attribute="area_slug")
    sectorSlug = fields.String(attribute="sector_slug")
    cragSlug = fields.String(attribute="crag_slug")
    videos = fields.List(fields.Dict)
    type = EnumField(LineTypeEnum, by_value=True)
    rating = fields.Integer()
    gradeValue = fields.Integer(attribute="grade_value")
    gradeScale = fields.String(attribute="grade_scale")
    faYear = fields.Integer(attribute="fa_year")
    faName = fields.String(attribute="fa_name")
    startingPosition = EnumField(StartingPositionEnum, by_value=True, attribute="starting_position")
    secret = fields.Boolean()
    archived = fields.Boolean()

    eliminate = fields.Boolean()
    traverse = fields.Boolean()
    highball = fields.Boolean()
    lowball = fields.Boolean()
    morpho = fields.Boolean()
    noTopout = fields.Boolean(attribute="no_topout")
    badDropzone = fields.Boolean(attribute="bad_dropzone")
    childFriendly = fields.Boolean(attribute="child_friendly")

    roof = fields.Boolean()
    slab = fields.Boolean()
    vertical = fields.Boolean()
    overhang = fields.Boolean()

    athletic = fields.Boolean()
    technical = fields.Boolean()
    endurance = fields.Boolean()
    cruxy = fields.Boolean()
    dyno = fields.Boolean()

    jugs = fields.Boolean()
    sloper = fields.Boolean()
    crimps = fields.Boolean()
    pockets = fields.Boolean()
    pinches = fields.Boolean()

    crack = fields.Boolean()
    dihedral = fields.Boolean()
    compression = fields.Boolean()
    arete = fields.Boolean()
    mantle = fields.Boolean()

    linePaths = fields.List(fields.Nested("LinePathSchemaForLines"), attribute="line_paths")

    ascentCount = fields.Integer(attribute="ascent_count")


class PaginatedLinesSchema(ma.SQLAlchemySchema):
    items = fields.List(fields.Nested(LineSchema()))
    hasNext = fields.Boolean(attribute="has_next")


line_schema = LineSchema()
paginated_lines_schema = PaginatedLinesSchema()
lines_schema = LineSchemaMin(many=True)
