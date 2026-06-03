from enum import Enum


class NotificationTypeEnum(Enum):
    COMMENT_REPLY = "comment_reply"
    REACTION = "reaction"
    FA_MODERATION_REMOVED = "fa_moderation_removed"
    RELEASE_NOTES = "release_notes"
    MODERATOR_TASK_COMPLETED = "moderator_task_completed"
    MODERATOR_TASK_CREATED = "moderator_task_created"
    MODERATOR_TASK_CREATED_AND_ASSIGNED = "moderator_task_created_and_assigned"
    MODERATOR_TASK_ASSIGNED = "moderator_task_assigned"
