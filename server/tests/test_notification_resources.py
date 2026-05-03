from models.line import Line
from models.notification import Notification
from models.post import Post


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
    assert len(rv.json) == 1
    assert rv.json[0]["type"] == "comment_reply"
    assert rv.json[0]["line"]["name"] == "Treppe"
    assert rv.json[0]["line"]["gradeScale"] is not None
    assert rv.json[0]["actionLink"] == f"/topo/brione/schattental/dritter-block-von-links/treppe/comments#{reply_id}"


def test_mark_notifications_read_hides_and_marks_delivered(client, admin_token, member_token):
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
        "/api/users/account/notifications/read",
        token=member_token,
        json={"notificationIds": [str(notification.id)]},
    )
    assert rv.status_code == 204, rv.text

    updated = Notification.query.filter_by(id=notification.id).first()
    assert updated.dismissed_at is not None
    assert updated.delivered_at is not None

    rv = client.get("/api/users/account/notifications", token=member_token)
    assert rv.status_code == 200, rv.text
    assert rv.json == []


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
    assert len(rv.json) == 1
    assert rv.json[0]["type"] == "comment_reply"
    assert rv.json[0]["line"] is None
    assert rv.json[0]["topicName"] == post.title
