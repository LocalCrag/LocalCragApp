from marshmallow import validate
from webargs import fields

from util.generic_relationships import ROCK_EXPLORER_OBJECT_TYPES

tag_args = {
    "objectType": fields.Str(
        required=True, validate=validate.OneOf(["Line", "Area", "Sector", "Crag", "User", *ROCK_EXPLORER_OBJECT_TYPES])
    ),
    "objectId": fields.UUID(required=True),
}
