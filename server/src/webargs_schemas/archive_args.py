from webargs import fields

archive_args = {
    "crag": fields.String(required=False),
    "sector": fields.String(required=False),
    "area": fields.String(required=False),
    "line": fields.String(required=False),
    "archived": fields.Boolean(required=True),
}
