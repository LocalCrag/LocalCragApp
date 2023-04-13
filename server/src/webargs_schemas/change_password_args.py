from webargs import fields

change_password_args = {
    "oldPassword": fields.Str(required=True),
    "newPassword": fields.Str(required=True),
}
