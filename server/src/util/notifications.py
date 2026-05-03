from models.enums.notification_type_enum import NotificationTypeEnum
from models.notification import Notification


def should_send_notification_mail(settings, notification_type: NotificationTypeEnum) -> bool:
    if not settings:
        return True
    if notification_type == NotificationTypeEnum.COMMENT_REPLY:
        return settings.comment_reply_mails_enabled
    if notification_type == NotificationTypeEnum.REACTION:
        return settings.reaction_notifications_enabled
    if notification_type == NotificationTypeEnum.FA_MODERATION_REMOVED:
        return settings.system_notifications_enabled
    return True


def create_notification_for_user(
    user_id,
    notification_type: NotificationTypeEnum,
    *,
    actor_id=None,
    entity_type=None,
    entity_id=None,
):
    notification = Notification()
    notification.user_id = user_id
    notification.type = notification_type
    notification.actor_id = actor_id
    notification.entity_type = entity_type
    notification.entity_id = entity_id
    return notification
