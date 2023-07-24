from webargs import fields

area_args = {
    "name": fields.Str(required=True),
    "lat": fields.Float(required=True, allow_none=True),
    "lng": fields.Float(required=True, allow_none=True),
    "description": fields.Str(required=True, allow_none=True),
    "portraitImage": fields.String(required=True, allow_none=True)
}
