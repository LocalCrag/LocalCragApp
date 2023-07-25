from webargs import fields

area_args = {
    "name": fields.Str(required=True),
    "lat": fields.Float(required=True, allow_none=True, validate=lambda x: abs(x) <= 90),
    "lng": fields.Float(required=True, allow_none=True, validate=lambda x: abs(x) <= 180),
    "description": fields.Str(required=True, allow_none=True),
    "portraitImage": fields.String(required=True, allow_none=True)
}
