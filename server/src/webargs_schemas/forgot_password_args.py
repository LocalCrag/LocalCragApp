from webargs import fields

forgot_password_args = {
    "email": fields.Str(required=True),
}
