from marshmallow import validate
from webargs import fields

reaction_args = {
    "emoji": fields.Str(
        required=True,
        validate=validate.OneOf(["💪", "❤️", "👍", "🤯", "🔥", "🎉", "😀"]),
    ),
}
