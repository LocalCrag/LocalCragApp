from webargs import fields

line_path_args = {
    "line": fields.String(required=True, allow_none=False),
    "path": fields.Dict(required=True, allow_none=False)  # TODO validation schema for json structure
}
