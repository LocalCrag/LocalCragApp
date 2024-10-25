from webargs import fields

from models.enums.todo_priority_enum import TodoPriorityEnum

todo_args = {
    "line": fields.String(required=True, allow_none=False),
}

todo_priority_args = {
    "priority": fields.Enum(TodoPriorityEnum, required=True, allow_none=False),
}
