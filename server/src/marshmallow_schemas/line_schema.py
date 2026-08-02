from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from marshmallow_schemas.area_schema import AscentAndTodoAreaSchema
from marshmallow_schemas.base_entity_schema import BaseEntityMinSchema
from marshmallow_schemas.crag_schema import AscentAndTodoCragSchema
from marshmallow_schemas.mixins.is_closable import (
    IsClosableDetailSchemaMixin,
    IsClosableListSchemaMixin,
)
from marshmallow_schemas.mixins.moderator_task_count import (
    ModeratorTaskCountSchemaMixin,
)
from marshmallow_schemas.sector_schema import AscentAndTodoSectorSchema
from models.enums.drying_enum import DryingEnum
from models.enums.line_type_enum import LineTypeEnum
from models.enums.starting_position_enum import StartingPositionEnum


class LineFaUserSchema(ma.Schema):
    """UserMin fields plus the FA ascent's year/date."""

    id = fields.String(attribute="user.id")
    slug = fields.String(attribute="user.slug")
    firstname = fields.String(attribute="user.firstname")
    lastname = fields.String(attribute="user.lastname")
    year = fields.Integer()
    date = fields.Date()


class AscentAndTodoLineSchema(ma.SQLAlchemySchema):
    name = fields.String()
    slug = fields.String()
    id = fields.String()
    type = EnumField(LineTypeEnum, by_value=True)
    authorGradeValue = fields.Integer(attribute="author_grade_value")
    userGradeValue = fields.Integer(attribute="user_grade_value")
    gradeScale = fields.String(attribute="grade_scale")


class LineSchemaMin(BaseEntityMinSchema):
    name = fields.String()
    slug = fields.String()
    color = fields.String()
    type = EnumField(LineTypeEnum, by_value=True)
    authorGradeValue = fields.Integer(attribute="author_grade_value")
    userGradeValue = fields.Integer(attribute="user_grade_value")
    gradeScale = fields.String(attribute="grade_scale")
    archived = fields.Boolean()


class LineSchema(BaseEntityMinSchema, IsClosableListSchemaMixin):
    name = fields.String()
    description = fields.String()
    slug = fields.String()
    color = fields.String()
    areaSlug = fields.String(attribute="area_slug")
    sectorSlug = fields.String(attribute="sector_slug")
    cragSlug = fields.String(attribute="crag_slug")
    area = fields.Nested(AscentAndTodoAreaSchema())
    sector = fields.Nested(AscentAndTodoSectorSchema(), attribute="area.sector")
    crag = fields.Nested(AscentAndTodoCragSchema(), attribute="area.sector.crag")
    videos = fields.List(fields.Dict)
    type = EnumField(LineTypeEnum, by_value=True)
    authorRating = fields.Integer(attribute="author_rating")
    userRating = fields.Integer(attribute="user_rating")
    authorGradeValue = fields.Integer(attribute="author_grade_value")
    userGradeValue = fields.Integer(attribute="user_grade_value")
    gradeScale = fields.String(attribute="grade_scale")
    faYear = fields.Integer(attribute="fa_year")
    faDate = fields.Date(attribute="fa_date")
    faName = fields.String(attribute="fa_name")
    routesetter = fields.String()
    setDate = fields.Date(attribute="set_date")
    bolter = fields.String()
    boltDate = fields.Date(attribute="bolt_date")
    startingPosition = EnumField(StartingPositionEnum, by_value=True, attribute="starting_position")
    drying = EnumField(DryingEnum, by_value=True, allow_none=True)
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
    commentCount = fields.Integer(attribute="comment_count")


class LineDetailSchema(LineSchema, IsClosableDetailSchemaMixin, ModeratorTaskCountSchemaMixin):
    imageCount = fields.Integer(attribute="image_count")
    faUsers = fields.Method("get_fa_users")

    def get_fa_users(self, obj):
        return LineFaUserSchema(many=True).dump(obj.get_fa_users())


class PaginatedLinesSchema(ma.SQLAlchemySchema):
    items = fields.List(fields.Nested(LineSchema()))
    hasNext = fields.Boolean(attribute="has_next")


line_schema = LineDetailSchema()
paginated_lines_schema = PaginatedLinesSchema()
lines_schema = LineSchemaMin(many=True)
ascent_and_todo_lines_schema = AscentAndTodoLineSchema()
