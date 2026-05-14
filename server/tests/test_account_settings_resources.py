from models.enums.notification_type_enum import NotificationTypeEnum
from models.line import Line
from models.notification import Notification


def test_get_account_settings(client, member_token):
    rv = client.get("/api/users/account/settings", token=member_token)
    assert rv.status_code == 200, rv.text
    assert rv.json["commentReplyMailsEnabled"] is True
    assert rv.json["reactionNotificationsEnabled"] is False
    assert rv.json["systemNotificationsEnabled"] is True
    assert rv.json["notificationDigestFrequency"] == "daily"
    assert rv.json["language"] in ("de", "en", "it")


def test_update_account_settings(client, member_token):
    rv = client.put(
        "/api/users/account/settings",
        token=member_token,
        json={
            "commentReplyMailsEnabled": False,
            "reactionNotificationsEnabled": False,
            "systemNotificationsEnabled": False,
            "notificationDigestFrequency": "daily",
            "language": "it",
        },
    )
    assert rv.status_code == 200, rv.text
    assert rv.json["commentReplyMailsEnabled"] is False
    assert rv.json["reactionNotificationsEnabled"] is False
    assert rv.json["systemNotificationsEnabled"] is False
    assert rv.json["notificationDigestFrequency"] == "daily"
    assert rv.json["language"] == "it"


def test_update_account_settings_weekly_digest(client, member_token):
    rv = client.put(
        "/api/users/account/settings",
        token=member_token,
        json={
            "commentReplyMailsEnabled": True,
            "reactionNotificationsEnabled": True,
            "systemNotificationsEnabled": True,
            "notificationDigestFrequency": "weekly",
            "language": "en",
        },
    )
    assert rv.status_code == 200, rv.text
    assert rv.json["notificationDigestFrequency"] == "weekly"
    # Read again
    rv = client.get("/api/users/account/settings", token=member_token)
    assert rv.json["commentReplyMailsEnabled"] is True
    assert rv.json["reactionNotificationsEnabled"] is True
    assert rv.json["systemNotificationsEnabled"] is True
    assert rv.json["notificationDigestFrequency"] == "weekly"
    assert rv.json["language"] == "en"


def test_comment_reply_email_sent_when_enabled(client, admin_token, member_token, smtp_mock):
    line_id = Line.get_id_by_slug("treppe")
    # Member creates root comment
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"objectType": "Line", "objectId": line_id, "message": "Root comment"},
    )
    assert rv.status_code == 201, rv.text
    root_id = rv.json["id"]
    # Admin replies
    rv = client.post(
        "/api/comments",
        token=admin_token,
        json={
            "objectType": "Line",
            "objectId": line_id,
            "message": "Reply comment",
            "parentId": root_id,
        },
    )
    assert rv.status_code == 201, rv.text
    # Three mails: two for root comment to admin and superadmin, one for reply to superadmin
    assert smtp_mock.return_value.__enter__.return_value.sendmail.call_count == 3
    assert Notification.query.filter(Notification.type == NotificationTypeEnum.COMMENT_REPLY).count() == 1


def test_comment_reply_email_not_sent_when_disabled(client, admin_token, member_token, smtp_mock):
    # Disable setting for member
    rv = client.put(
        "/api/users/account/settings",
        token=member_token,
        json={
            "commentReplyMailsEnabled": False,
            "reactionNotificationsEnabled": True,
            "systemNotificationsEnabled": True,
            "notificationDigestFrequency": "daily",
            "language": "de",
        },
    )
    assert rv.status_code == 200, rv.text
    line_id = Line.get_id_by_slug("treppe")
    # Member creates root comment
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"objectType": "Line", "objectId": line_id, "message": "Root comment"},
    )
    assert rv.status_code == 201, rv.text
    root_id = rv.json["id"]
    # Admin replies
    rv = client.post(
        "/api/comments",
        token=admin_token,
        json={
            "objectType": "Line",
            "objectId": line_id,
            "message": "Reply comment",
            "parentId": root_id,
        },
    )
    assert rv.status_code == 201, rv.text
    # Three mails: Two for root comment (admin and superadmin), one for reply (superadmin), member gets none
    assert smtp_mock.return_value.__enter__.return_value.sendmail.call_count == 3
    assert Notification.query.filter(Notification.type == NotificationTypeEnum.COMMENT_REPLY).count() == 1


def test_update_account_settings_invalid_language(client, member_token):
    rv = client.put(
        "/api/users/account/settings",
        token=member_token,
        json={
            "commentReplyMailsEnabled": True,
            "reactionNotificationsEnabled": True,
            "systemNotificationsEnabled": True,
            "notificationDigestFrequency": "daily",
            "language": "fr",
        },
    )
    assert rv.status_code == 400, rv.text
