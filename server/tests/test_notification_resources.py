from extensions import db
from models.enums.notification_type_enum import NotificationTypeEnum
from models.enums.release_note_item_type_enum import ReleaseNoteItemTypeEnum
from models.line import Line
from models.notification import Notification
from models.post import Post
from models.release_note_bundle import ReleaseNoteBundle
from models.release_note_item import ReleaseNoteItem
from models.user import User


def test_get_notifications_includes_release_note_item_keys(client, member_token):
    member = User.find_by_email("member@localcrag.invalid.org")
    bundle = ReleaseNoteBundle()
    db.session.add(bundle)
    db.session.flush()

    fix_item = ReleaseNoteItem()
    fix_item.item_key = "rnApiTestFix"
    fix_item.note_type = ReleaseNoteItemTypeEnum.FIX
    fix_item.bundle_id = bundle.id
    db.session.add(fix_item)

    feat_item = ReleaseNoteItem()
    feat_item.item_key = "rnApiTestFeat"
    feat_item.note_type = ReleaseNoteItemTypeEnum.FEATURE
    feat_item.bundle_id = bundle.id
    db.session.add(feat_item)

    note = Notification()
    note.user_id = member.id
    note.type = NotificationTypeEnum.RELEASE_NOTES
    note.entity_type = "release_note_bundle"
    note.entity_id = bundle.id
    db.session.add(note)
    db.session.commit()

    rv = client.get(
        "/api/users/account/notifications?include_dismissed=1",
        token=member_token,
    )
    assert rv.status_code == 200, rv.text
    release_rows = [i for i in rv.json["items"] if i["type"] == "release_notes"]
    assert len(release_rows) >= 1
    ours = next(r for r in release_rows if r.get("entityId") == str(bundle.id))
    assert ours["releaseNoteItemKeys"] == ["rnApiTestFeat", "rnApiTestFix"]


def test_get_notifications_lists_unread(client, admin_token, member_token):
    line_id = Line.get_id_by_slug("treppe")
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"objectType": "Line", "objectId": line_id, "message": "Root comment"},
    )
    assert rv.status_code == 201, rv.text
    root_id = rv.json["id"]

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
    reply_id = rv.json["id"]

    rv = client.get("/api/users/account/notifications", token=member_token)
    assert rv.status_code == 200, rv.text
    assert len(rv.json["items"]) == 1
    assert rv.json["hasNext"] is False
    assert rv.json["items"][0]["type"] == "comment_reply"
    assert rv.json["items"][0]["line"]["name"] == "Treppe"
    assert rv.json["items"][0]["line"]["gradeScale"] is not None
    assert rv.json["items"][0]["isDismissed"] is False
    assert (
        rv.json["items"][0]["actionLink"]
        == f"/topo/brione/schattental/dritter-block-von-links/treppe/comments#{reply_id}"
    )


def test_dismiss_notifications_single_id_hides_and_marks_delivered(client, admin_token, member_token):
    line_id = Line.get_id_by_slug("treppe")
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"objectType": "Line", "objectId": line_id, "message": "Root comment"},
    )
    assert rv.status_code == 201, rv.text
    root_id = rv.json["id"]

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

    notifications = Notification.query.all()
    assert len(notifications) == 1
    notification = notifications[0]

    rv = client.post(
        f"/api/users/account/notifications/{notification.id}/dismiss",
        token=member_token,
    )
    assert rv.status_code == 204, rv.text

    updated = Notification.query.filter_by(id=notification.id).first()
    assert updated.dismissed_at is not None
    assert updated.delivered_at is not None

    rv = client.get("/api/users/account/notifications", token=member_token)
    assert rv.status_code == 200, rv.text
    assert rv.json["items"] == []
    assert rv.json["hasNext"] is False


def test_get_notifications_uses_post_title_for_post_comment_replies(client, admin_token, member_token):
    post = Post.query.first()
    assert post is not None
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"objectType": "Post", "objectId": str(post.id), "message": "Root post comment"},
    )
    assert rv.status_code == 201, rv.text
    root_id = rv.json["id"]

    rv = client.post(
        "/api/comments",
        token=admin_token,
        json={
            "objectType": "Post",
            "objectId": str(post.id),
            "message": "Reply post comment",
            "parentId": root_id,
        },
    )
    assert rv.status_code == 201, rv.text

    rv = client.get("/api/users/account/notifications", token=member_token)
    assert rv.status_code == 200, rv.text
    assert len(rv.json["items"]) == 1
    assert rv.json["items"][0]["type"] == "comment_reply"
    assert rv.json["items"][0]["line"] is None
    assert rv.json["items"][0]["topicName"] == post.title


def test_dismiss_all_notifications_marks_everything_for_user(client, admin_token, member_token):
    line_id = Line.get_id_by_slug("treppe")
    for idx in range(2):
        rv = client.post(
            "/api/comments",
            token=member_token,
            json={"objectType": "Line", "objectId": line_id, "message": f"Root comment {idx}"},
        )
        assert rv.status_code == 201, rv.text
        root_id = rv.json["id"]

        rv = client.post(
            "/api/comments",
            token=admin_token,
            json={
                "objectType": "Line",
                "objectId": line_id,
                "message": f"Reply comment {idx}",
                "parentId": root_id,
            },
        )
        assert rv.status_code == 201, rv.text

    rv = client.post("/api/users/account/notifications/dismiss-all", token=member_token)
    assert rv.status_code == 204, rv.text

    notifications = Notification.query.all()
    assert len(notifications) == 2
    assert all(notification.dismissed_at is not None for notification in notifications)
    assert all(notification.delivered_at is not None for notification in notifications)


def test_dismiss_notification_marks_selected(client, admin_token, member_token):
    line_id = Line.get_id_by_slug("treppe")
    created_ids = []
    for idx in range(2):
        rv = client.post(
            "/api/comments",
            token=member_token,
            json={"objectType": "Line", "objectId": line_id, "message": f"Root comment {idx}"},
        )
        assert rv.status_code == 201, rv.text
        root_id = rv.json["id"]
        rv = client.post(
            "/api/comments",
            token=admin_token,
            json={
                "objectType": "Line",
                "objectId": line_id,
                "message": f"Reply comment {idx}",
                "parentId": root_id,
            },
        )
        assert rv.status_code == 201, rv.text
        created_ids.append(str(Notification.query.order_by(Notification.time_created.desc()).first().id))

    rv = client.post(
        f"/api/users/account/notifications/{created_ids[0]}/dismiss",
        token=member_token,
    )
    assert rv.status_code == 204, rv.text

    notifications = Notification.query.order_by(Notification.time_created.desc()).all()
    assert len(notifications) == 2
    dismissed = [n for n in notifications if n.dismissed_at is not None]
    active = [n for n in notifications if n.dismissed_at is None]
    assert len(dismissed) == 1
    assert len(active) == 1


def test_get_notifications_include_dismissed_returns_read_items(client, admin_token, member_token):
    line_id = Line.get_id_by_slug("treppe")
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"objectType": "Line", "objectId": line_id, "message": "Root comment"},
    )
    assert rv.status_code == 201, rv.text
    root_id = rv.json["id"]

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

    notification = Notification.query.first()
    assert notification is not None

    rv = client.post(
        f"/api/users/account/notifications/{notification.id}/dismiss",
        token=member_token,
    )
    assert rv.status_code == 204, rv.text

    rv = client.get("/api/users/account/notifications", token=member_token)
    assert rv.status_code == 200, rv.text
    assert rv.json["items"] == []

    rv = client.get(
        "/api/users/account/notifications?include_dismissed=1",
        token=member_token,
    )
    assert rv.status_code == 200, rv.text
    assert len(rv.json["items"]) == 1
    assert rv.json["items"][0]["isDismissed"] is True


def test_get_notifications_count_returns_undismissed_count(client, admin_token, member_token):
    line_id = Line.get_id_by_slug("treppe")
    for idx in range(2):
        rv = client.post(
            "/api/comments",
            token=member_token,
            json={"objectType": "Line", "objectId": line_id, "message": f"Root comment {idx}"},
        )
        assert rv.status_code == 201, rv.text
        root_id = rv.json["id"]
        rv = client.post(
            "/api/comments",
            token=admin_token,
            json={
                "objectType": "Line",
                "objectId": line_id,
                "message": f"Reply comment {idx}",
                "parentId": root_id,
            },
        )
        assert rv.status_code == 201, rv.text

    rv = client.get("/api/users/account/notifications/count", token=member_token)
    assert rv.status_code == 200, rv.text
    assert rv.json["count"] == 2

    newest = Notification.query.order_by(Notification.time_created.desc()).first()
    assert newest is not None
    rv = client.post(
        f"/api/users/account/notifications/{newest.id}/dismiss",
        token=member_token,
    )
    assert rv.status_code == 204, rv.text

    rv = client.get("/api/users/account/notifications/count", token=member_token)
    assert rv.status_code == 200, rv.text
    assert rv.json["count"] == 1
