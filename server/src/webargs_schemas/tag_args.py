from marshmallow import validate
from webargs import fields

tag_args = {
    "objectType": fields.Str(required=True, validate=validate.OneOf(["Line", "Area", "Sector", "Crag", "User"])),
    "objectId": fields.UUID(required=True),
}
