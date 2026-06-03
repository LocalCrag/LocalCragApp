from models.enums.notification_type_enum import NotificationTypeEnum
from models.moderator_task import ModeratorTask
from models.user import User
from util.notifications import create_notification_for_user

MODERATOR_TASK_NOTIFICATION_TYPES = frozenset(
    {
        NotificationTypeEnum.MODERATOR_TASK_COMPLETED,
        NotificationTypeEnum.MODERATOR_TASK_CREATED,
        NotificationTypeEnum.MODERATOR_TASK_CREATED_AND_ASSIGNED,
        NotificationTypeEnum.MODERATOR_TASK_ASSIGNED,
    }
)


def should_show_notification_to_user(user: User, notification_type: NotificationTypeEnum) -> bool:
    if notification_type in MODERATOR_TASK_NOTIFICATION_TYPES:
        return user.moderator
    return True


def moderator_recipient_ids_excluding(exclude_ids) -> set:
    exclude = {user_id for user_id in exclude_ids if user_id}
    recipient_ids = set()
    moderators = User.query.filter(User.moderator.is_(True)).all()
    for moderator in moderators:
        if moderator.id not in exclude:
            recipient_ids.add(moderator.id)
    return recipient_ids


def add_task_notification(task: ModeratorTask, actor: User, user_id, notification_type: NotificationTypeEnum):
    return create_notification_for_user(
        user_id,
        notification_type,
        actor_id=actor.id,
        entity_type="moderator_task",
        entity_id=task.id,
    )


def notify_task_created(task: ModeratorTask, actor: User, session_add):
    assignee_id = task.assigned_to_id
    for user_id in moderator_recipient_ids_excluding([actor.id, assignee_id]):
        session_add(add_task_notification(task, actor, user_id, NotificationTypeEnum.MODERATOR_TASK_CREATED))
    if assignee_id and assignee_id != actor.id:
        session_add(
            add_task_notification(
                task,
                actor,
                assignee_id,
                NotificationTypeEnum.MODERATOR_TASK_CREATED_AND_ASSIGNED,
            )
        )


def notify_task_assigned(task: ModeratorTask, actor: User, previous_assignee_id, session_add):
    if task.assigned_to_id and task.assigned_to_id != actor.id and task.assigned_to_id != previous_assignee_id:
        session_add(
            add_task_notification(
                task,
                actor,
                task.assigned_to_id,
                NotificationTypeEnum.MODERATOR_TASK_ASSIGNED,
            )
        )


def notify_task_completed(task: ModeratorTask, actor: User, session_add):
    recipient_ids = moderator_recipient_ids_excluding([actor.id])
    if task.assigned_to_id and task.assigned_to_id != actor.id:
        recipient_ids.add(task.assigned_to_id)
    for user_id in recipient_ids:
        session_add(add_task_notification(task, actor, user_id, NotificationTypeEnum.MODERATOR_TASK_COMPLETED))
