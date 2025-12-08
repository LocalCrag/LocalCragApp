from marshmallow import fields

from extensions import ma


class AccountSettingsSchema(ma.SQLAlchemySchema):
    commentReplyMailsEnabled = fields.Boolean(attribute="comment_reply_mails_enabled")
    language = fields.String(attribute="language")


account_settings_schema = AccountSettingsSchema()
