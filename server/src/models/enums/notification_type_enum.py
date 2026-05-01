from enum import Enum


class NotificationTypeEnum(Enum):
    COMMENT_REPLY = "comment_reply"
    REACTION = "reaction"
    FA_MODERATION_REMOVED = "fa_moderation_removed"
