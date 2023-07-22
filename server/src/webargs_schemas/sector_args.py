from webargs import fields

sector_args = {
    "name": fields.Str(required=True),
    "description": fields.Str(required=True, allow_none=True),
    "shortDescription": fields.Str(required=True, allow_none=True),
    "portraitImage": fields.String(required=True, allow_none=True)
}
