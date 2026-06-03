from marshmallow import validate
from webargs import fields

moderator_task_args = {
    "title": fields.Str(required=True, validate=validate.Length(min=1, max=120)),
    "description": fields.Str(required=False, allow_none=True),
    "objectType": fields.Str(required=True, validate=validate.OneOf(["Line", "Area", "Sector", "Crag", "Region"])),
    "objectId": fields.Str(required=True),
    "assignedToId": fields.Str(required=False, allow_none=True),
}

moderator_task_update_args = {
    "title": fields.Str(required=True, validate=validate.Length(min=1, max=120)),
    "description": fields.Str(required=False, allow_none=True),
    "assignedToId": fields.Str(required=False, allow_none=True),
}
