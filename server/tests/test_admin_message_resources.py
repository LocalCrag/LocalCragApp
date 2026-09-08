from extensions import db
from models.admin_message import AdminMessage
from models.enums.notification_type_enum import NotificationTypeEnum
from models.notification import Notification
from models.user import User
from util.notification_digest_builder import build_digest_items
from util.notifications import should_send_notification_mail


def test_create_admin_message_fans_out_to_subscribed_users(client, admin_token, member_token):
    member = User.find_by_email("member@localcrag.invalid.org")
    admin = User.find_by_email("admin@localcrag.invalid.org")
    assert member.account_settings.admin_message_notifications_enabled is True

    rv = client.post(
        "/api/admin-messages",
        token=admin_token,
        json={"title": "Maintenance tonight", "text": "The gym closes at 8pm."},
    )
    assert rv.status_code == 201, rv.text
    message_id = rv.json["id"]
    assert rv.json["title"] == "Maintenance tonight"
    assert rv.json["text"] == "The gym closes at 8pm."

    member_notes = Notification.query.filter_by(
        user_id=member.id,
        type=NotificationTypeEnum.ADMIN_MESSAGE,
        entity_id=message_id,
    ).all()
    assert len(member_notes) == 1

    admin_notes = Notification.query.filter_by(
        user_id=admin.id,
        type=NotificationTypeEnum.ADMIN_MESSAGE,
        entity_id=message_id,
    ).all()
    assert len(admin_notes) == 1

    rv = client.get("/api/account/notifications", token=member_token)
    assert rv.status_code == 200, rv.text
    rows = [i for i in rv.json["items"] if i["type"] == "admin_message"]
    assert len(rows) >= 1
    ours = next(r for r in rows if r["entityId"] == message_id)
    assert ours["properties"]["adminMessage"]["title"] == "Maintenance tonight"
    assert ours["properties"]["adminMessage"]["text"] == "The gym closes at 8pm."
    assert ours["actionLink"] == f"/notifications?adminMessage={message_id}"


def test_create_admin_message_skips_unsubscribed_users(client, admin_token):
    member = User.find_by_email("member@localcrag.invalid.org")
    member.account_settings.admin_message_notifications_enabled = False
    db.session.add(member.account_settings)
    db.session.commit()

    rv = client.post(
        "/api/admin-messages",
        token=admin_token,
        json={"title": "Quiet update", "text": "Only for subscribers."},
    )
    assert rv.status_code == 201, rv.text
    message_id = rv.json["id"]

    member_notes = Notification.query.filter_by(
        user_id=member.id,
        type=NotificationTypeEnum.ADMIN_MESSAGE,
        entity_id=message_id,
    ).all()
    assert member_notes == []


def test_admin_message_crud_requires_admin(client, member_token, admin_token):
    rv = client.post(
        "/api/admin-messages",
        token=member_token,
        json={"title": "Nope", "text": "Members cannot create."},
    )
    assert rv.status_code == 401

    rv = client.post(
        "/api/admin-messages",
        token=admin_token,
        json={"title": "Editable", "text": "Original body"},
    )
    assert rv.status_code == 201, rv.text
    message_id = rv.json["id"]

    rv = client.put(
        f"/api/admin-messages/{message_id}",
        token=admin_token,
        json={"title": "Edited", "text": "Updated body"},
    )
    assert rv.status_code == 200, rv.text
    assert rv.json["title"] == "Edited"

    rv = client.get(f"/api/admin-messages/{message_id}", token=member_token)
    assert rv.status_code == 200, rv.text
    assert rv.json["text"] == "Updated body"

    rv = client.delete(f"/api/admin-messages/{message_id}", token=admin_token)
    assert rv.status_code == 204

    assert AdminMessage.query.filter_by(id=message_id).first() is None
    assert (
        Notification.query.filter_by(
            entity_type="admin_message",
            entity_id=message_id,
        ).count()
        == 0
    )


def test_admin_message_digest_and_mail_gate(client, admin_token):
    member = User.find_by_email("member@localcrag.invalid.org")
    rv = client.post(
        "/api/admin-messages",
        token=admin_token,
        json={"title": "Digest title", "text": "Digest body"},
    )
    assert rv.status_code == 201, rv.text
    message_id = rv.json["id"]

    note = Notification.query.filter_by(
        user_id=member.id,
        type=NotificationTypeEnum.ADMIN_MESSAGE,
        entity_id=message_id,
    ).one()

    assert should_send_notification_mail(member.account_settings, NotificationTypeEnum.ADMIN_MESSAGE) is True
    member.account_settings.admin_message_notifications_enabled = False
    assert should_send_notification_mail(member.account_settings, NotificationTypeEnum.ADMIN_MESSAGE) is False

    items = build_digest_items([note], None)
    assert len(items) == 1
    assert "Digest title" in items[0]["html"]
    assert f"notifications?adminMessage={message_id}" in items[0]["html"]
