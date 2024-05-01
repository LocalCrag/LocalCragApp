from marshmallow import fields
from marshmallow_enum import EnumField


from models.enums.line_type_enum import LineTypeEnum

from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from models.enums.starting_position_enum import StartingPositionEnum





class LineSchema(BaseEntitySchema):
    name = fields.String()
    description = fields.String()
    slug = fields.String()
    videos = fields.List(fields.Dict)
    type = EnumField(LineTypeEnum, by_value=True)
    rating = fields.Integer()
    gradeName = fields.String(attribute='grade_name')
    gradeScale = fields.String(attribute='grade_scale')
    faYear = fields.Integer(attribute='fa_year')
    faName = fields.String(attribute='fa_name')
    startingPosition = EnumField(StartingPositionEnum, by_value=True, attribute='starting_position')

    eliminate = fields.Boolean()
    traverse = fields.Boolean()
    highball = fields.Boolean()
    lowball = fields.Boolean()
    morpho = fields.Boolean()
    noTopout = fields.Boolean(attribute='no_topout')
    badDropzone = fields.Boolean(attribute='bad_dropzone')
    childFriendly = fields.Boolean(attribute='child_friendly')

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

    linePaths = fields.List(fields.Nested("LinePathSchemaForLines"), attribute='line_paths')

    ascentCount = fields.Integer(attribute='ascent_count')


line_schema = LineSchema()
lines_schema = LineSchema(many=True)
