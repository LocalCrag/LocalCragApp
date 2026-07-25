from marshmallow import validate
from webargs import fields

mark_rules_read_args = {
    "entityType": fields.Str(
        required=True,
        validate=validate.OneOf(["Region", "Crag", "Sector"]),
    ),
    "entityId": fields.Str(required=True),
}
