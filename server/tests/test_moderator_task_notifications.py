from extensions import db
from models.enums.notification_type_enum import NotificationTypeEnum
from models.moderator_task import ModeratorTask
from models.notification import Notification
from models.region import Region
from models.user import User
from util.moderator_task_notifications import (
    moderator_recipient_ids_excluding,
    should_show_notification_to_user,
)


def test_moderator_recipient_ids_only_includes_moderators():
    actor = User.find_by_email("moderator@localcrag.invalid.org")
    member = User.find_by_email("member@localcrag.invalid.org")
    admin = User.find_by_email("admin@localcrag.invalid.org")

    recipient_ids = moderator_recipient_ids_excluding([actor.id])

    assert actor.id not in recipient_ids
    assert member.id not in recipient_ids
    assert admin.id in recipient_ids


def test_should_hide_moderator_task_notifications_for_non_moderators():
    member = User.find_by_email("member@localcrag.invalid.org")
    assert should_show_notification_to_user(member, NotificationTypeEnum.MODERATOR_TASK_CREATED) is False
    assert should_show_notification_to_user(member, NotificationTypeEnum.COMMENT_REPLY) is True


def test_get_notifications_hides_moderator_task_notifications_for_non_moderators(client, member_token):
    member = User.find_by_email("member@localcrag.invalid.org")
    region = Region.return_it()
    moderator = User.find_by_email("moderator@localcrag.invalid.org")

    task = ModeratorTask()
    task.title = "Notification visibility test"
    task.object_type = "Region"
    task.object_id = region.id
    task.created_by_id = moderator.id
    db.session.add(task)
    db.session.flush()

    note = Notification()
    note.user_id = member.id
    note.type = NotificationTypeEnum.MODERATOR_TASK_CREATED
    note.entity_type = "moderator_task"
    note.entity_id = task.id
    db.session.add(note)
    db.session.commit()

    rv = client.get("/api/users/account/notifications", token=member_token)
    assert rv.status_code == 200
    assert all(item["type"] != "moderator_task_created" for item in rv.json["items"])
