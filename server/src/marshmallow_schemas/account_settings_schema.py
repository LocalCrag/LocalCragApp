from marshmallow import fields

from extensions import ma


class AccountSettingsSchema(ma.SQLAlchemySchema):
    commentReplyMailsEnabled = fields.Boolean(attribute="comment_reply_mails_enabled")
    reactionNotificationsEnabled = fields.Boolean(attribute="reaction_notifications_enabled")
    systemNotificationsEnabled = fields.Boolean(attribute="system_notifications_enabled")
    moderatorTaskNotificationsEnabled = fields.Boolean(attribute="moderator_task_notifications_enabled")
    notificationDigestFrequency = fields.Function(lambda obj: obj.notification_digest_frequency.value)
    language = fields.String(attribute="language")
    colorScheme = fields.Function(lambda obj: obj.color_scheme.value)


account_settings_schema = AccountSettingsSchema()
