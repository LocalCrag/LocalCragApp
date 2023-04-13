from webargs import fields

login_args = {
    "email": fields.Str(required=True),
    "password": fields.Str(required=True),
}
