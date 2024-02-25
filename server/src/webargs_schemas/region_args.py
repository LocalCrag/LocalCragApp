from webargs import fields

region_args = {
    "description": fields.Str(required=True, allow_none=True),
}
