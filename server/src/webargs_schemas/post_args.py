from webargs import fields

post_args = {
    "title": fields.Str(required=True),
    "text": fields.Str(required=True),
}
