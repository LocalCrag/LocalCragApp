from marshmallow import fields, missing

from util.security_util import current_user_is_moderator


class ModeratorTaskCountSchemaMixin:
    """Include ``taskCount`` only for moderator callers (omit otherwise)."""

    taskCount = fields.Method("get_task_count")

    def get_task_count(self, obj):
        if not current_user_is_moderator():
            return missing
        return obj.task_count
