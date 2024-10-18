from marshmallow import fields
from marshmallow_enum import EnumField

from extensions import ma
from marshmallow_schemas.area_schema import AscentAndTodoAreaSchema
from marshmallow_schemas.base_entity_schema import BaseEntitySchema
from marshmallow_schemas.crag_schema import AscentAndTodoCragSchema
from marshmallow_schemas.line_schema import AscentAndTodoLineSchema
from marshmallow_schemas.sector_schema import AscentAndTodoSectorSchema
from models.enums.todo_priority_enum import TodoPriorityEnum


class TodoSchema(BaseEntitySchema):
    line = fields.Nested(AscentAndTodoLineSchema())
    crag = fields.Nested(AscentAndTodoCragSchema())
    sector = fields.Nested(AscentAndTodoSectorSchema())
    area = fields.Nested(AscentAndTodoAreaSchema())
    priority = EnumField(TodoPriorityEnum, by_value=True)


class PaginatedTodosSchema(ma.SQLAlchemySchema):
    items = fields.List(fields.Nested(TodoSchema()))
    hasNext = fields.Boolean(attribute="has_next")


todo_schema = TodoSchema()
paginated_todos_schema = PaginatedTodosSchema()
