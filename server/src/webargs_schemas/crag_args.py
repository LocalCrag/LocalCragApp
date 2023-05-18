from webargs import fields

crag_args = {
    "name": fields.Str(required=True),
    "description": fields.Str(required=True, allow_none=True),
    "shortDescription": fields.Str(required=True, allow_none=True),
    "rules": fields.Str(required=True, allow_none=True),
    "portraitImage": fields.String(required=True, allow_none=True)
}
