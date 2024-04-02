from webargs import fields

new_email_args = {
    "newEmailHash": fields.Str(required=True),
}
