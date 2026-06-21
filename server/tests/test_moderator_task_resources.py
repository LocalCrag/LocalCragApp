from models.enums.notification_type_enum import NotificationTypeEnum
from models.line import Line
from models.moderator_task import ModeratorTask
from models.notification import Notification
from models.region import Region
from models.user import User


def test_moderator_task_crud_and_scope(client, moderator_token, user_token):
    region = Region.return_it()
    line_id = Line.get_id_by_slug("stairs")

    rv = client.post(
        "/api/moderator-tasks",
        token=user_token,
        json={
            "title": "Should fail",
            "objectType": "Region",
            "objectId": str(region.id),
        },
    )
    assert rv.status_code == 401

    rv = client.post(
        "/api/moderator-tasks",
        token=moderator_token,
        json={
            "title": "Region task",
            "description": "<p>Do something</p>",
            "objectType": "Region",
            "objectId": str(region.id),
        },
    )
    assert rv.status_code == 201
    region_task_id = rv.json["id"]
    assert rv.json["title"] == "Region task"
    assert rv.json["createdBy"] is not None
    assert rv.json["assignedTo"] is None

    admin = User.find_by_email("admin@localcrag.invalid.org")
    rv = client.post(
        "/api/moderator-tasks",
        token=moderator_token,
        json={
            "title": "Assigned task",
            "objectType": "Region",
            "objectId": str(region.id),
            "assignedToId": str(admin.id),
        },
    )
    assert rv.status_code == 201
    assigned_task_id = rv.json["id"]
    assert rv.json["assignedTo"]["id"] == str(admin.id)

    assignee_notification = Notification.query.filter(
        Notification.type == NotificationTypeEnum.MODERATOR_TASK_CREATED_AND_ASSIGNED,
        Notification.entity_id == assigned_task_id,
        Notification.user_id == admin.id,
    ).first()
    assert assignee_notification is not None

    assignee_created_notification = Notification.query.filter(
        Notification.type == NotificationTypeEnum.MODERATOR_TASK_CREATED,
        Notification.entity_id == assigned_task_id,
        Notification.user_id == admin.id,
    ).first()
    assert assignee_created_notification is None

    rv = client.post(
        "/api/moderator-tasks",
        token=moderator_token,
        json={
            "title": "Line task",
            "objectType": "Line",
            "objectId": str(line_id),
        },
    )
    assert rv.status_code == 201
    line_task_id = rv.json["id"]

    rv = client.get(
        "/api/moderator-tasks?scope-type=Line&line-slug=stairs&page=1&per_page=50",
        token=moderator_token,
    )
    assert rv.status_code == 200
    line_scope_ids = {task["id"] for task in rv.json["items"]}
    assert line_task_id in line_scope_ids

    rv = client.get(
        "/api/moderator-tasks?scope-type=Region&page=1&per_page=50",
        token=moderator_token,
    )
    assert rv.status_code == 200
    assert rv.json["hasNext"] is False
    task_ids = {task["id"] for task in rv.json["items"]}
    assert region_task_id in task_ids
    assert line_task_id in task_ids
    assert rv.json["items"][0]["completed"] is False

    rv = client.get(
        f"/api/moderator-tasks?scope-type=Region&assigned-to-id={admin.id}",
        token=moderator_token,
    )
    assert rv.status_code == 200
    assert len(rv.json["items"]) == 1
    assert rv.json["items"][0]["id"] == assigned_task_id

    rv = client.get(
        "/api/moderator-tasks?scope-type=Region&assigned-to-unassigned=true&page=1&per_page=50",
        token=moderator_token,
    )
    assert rv.status_code == 200
    unassigned_task_ids = {task["id"] for task in rv.json["items"]}
    assert assigned_task_id not in unassigned_task_ids
    assert region_task_id in unassigned_task_ids

    rv = client.put(
        f"/api/moderator-tasks/{region_task_id}",
        token=moderator_token,
        json={"title": "Updated region task", "description": "<p>Updated</p>"},
    )
    assert rv.status_code == 200
    assert rv.json["title"] == "Updated region task"

    rv = client.put(
        f"/api/moderator-tasks/{region_task_id}",
        token=moderator_token,
        json={
            "title": "Updated region task",
            "description": "<p>Updated</p>",
            "assignedToId": str(admin.id),
        },
    )
    assert rv.status_code == 200
    assert rv.json["assignedTo"]["id"] == str(admin.id)
    assigned_notification = Notification.query.filter(
        Notification.type == NotificationTypeEnum.MODERATOR_TASK_ASSIGNED,
        Notification.entity_id == region_task_id,
        Notification.user_id == admin.id,
    ).first()
    assert assigned_notification is not None

    rv = client.post(
        f"/api/moderator-tasks/{line_task_id}/toggle-complete",
        token=moderator_token,
    )
    assert rv.status_code == 200
    assert rv.json["completed"] is True
    assert rv.json["finishedBy"] is not None
    assert rv.json["timeFinished"] is not None

    notifications = Notification.query.filter(
        Notification.type == NotificationTypeEnum.MODERATOR_TASK_COMPLETED,
        Notification.entity_id == line_task_id,
    ).all()
    assert len(notifications) >= 1

    rv = client.delete(f"/api/moderator-tasks/{region_task_id}", token=moderator_token)
    assert rv.status_code == 204
    assert ModeratorTask.query.filter_by(id=region_task_id).first() is None


def test_moderator_task_description_replaces_bucket_placeholders_on_read(client, moderator_token, monkeypatch):
    bucket_url = "https://cdn.example.com/my-bucket"
    monkeypatch.setattr(
        "util.bucket_placeholders.get_bucket_placeholders",
        lambda: ("{{BUCKET_PLACEHOLDER}}", bucket_url),
    )

    region = Region.return_it()
    image_html = f'<p><img src="{bucket_url}/uploads/foo.jpg"></p>'

    rv = client.post(
        "/api/moderator-tasks",
        token=moderator_token,
        json={
            "title": "Task with image",
            "description": image_html,
            "objectType": "Region",
            "objectId": str(region.id),
        },
    )
    assert rv.status_code == 201
    task_id = rv.json["id"]

    stored_task = ModeratorTask.find_by_id(task_id)
    assert "{{BUCKET_PLACEHOLDER}}" in stored_task.description
    assert bucket_url not in stored_task.description

    rv = client.get(f"/api/moderator-tasks/{task_id}", token=moderator_token)
    assert rv.status_code == 200
    assert bucket_url in rv.json["description"]
    assert "{{BUCKET_PLACEHOLDER}}" not in rv.json["description"]
