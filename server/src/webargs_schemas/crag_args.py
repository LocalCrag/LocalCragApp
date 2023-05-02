from webargs import fields

crag_args = {
    "id": fields.Str(required=False),
    "name": fields.Str(required=True),
    "description": fields.Str(required=False),
    "rules": fields.Str(required=False),
}
