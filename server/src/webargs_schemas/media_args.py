from webargs import fields

svg_to_png_args = {
    "svg": fields.String(required=True),
    "prefix": fields.String(required=False)
}
