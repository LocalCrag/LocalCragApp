from marshmallow import validate
from webargs import fields

comment_args = {
    "message": fields.Str(required=True, validate=validate.Length(min=1, max=10000)),
    "objectType": fields.Str(
        required=True, validate=validate.OneOf(["Line", "Area", "Sector", "Crag", "Region", "Post"])
    ),
    "objectId": fields.Str(required=True),
    "parentId": fields.Str(required=False, allow_none=True),
}

comment_update_args = {
    "message": fields.Str(required=True, validate=validate.Length(min=1, max=10000)),
}
