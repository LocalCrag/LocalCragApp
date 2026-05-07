from webargs import fields

get_notifications_args = {
    "page": fields.Integer(load_default=1),
    "per_page": fields.Integer(load_default=10),
    "include_dismissed": fields.Boolean(load_default=False),
}
