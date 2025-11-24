from webargs import fields

account_settings_args = {
    "commentReplyMailsEnabled": fields.Boolean(required=True),
}
