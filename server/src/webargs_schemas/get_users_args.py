from webargs import fields

get_users_args = {
    "isModerator": fields.Bool(load_default=False),
}
