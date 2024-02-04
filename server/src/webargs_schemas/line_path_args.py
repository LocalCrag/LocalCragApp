from webargs import fields

line_path_args = {
    "line": fields.String(required=True, allow_none=False),
    "path": fields.List(fields.Float, required=True, allow_none=False)
}
