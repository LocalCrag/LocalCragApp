from models.area import Area
from models.line import Line


def test_create_comment_on_line(client, member_token):
    line_id = Line.get_id_by_slug("treppe")
    payload = {
        "message": "Nice climb!",
        "objectType": "Line",
        "objectId": str(line_id),
        "parentId": None,
    }
    rv = client.post("/api/comments", token=member_token, json=payload)
    assert rv.status_code == 201
    res = rv.json
    assert res["message"] == "Nice climb!"
    assert res.get("rootId") is None
    assert res.get("isDeleted") in (False, None)


def test_reply_to_comment(client, member_token):
    line_id = Line.get_id_by_slug("treppe")
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Parent", "objectType": "Line", "objectId": str(line_id)},
    )
    assert rv.status_code == 201
    parent_id = rv.json["id"]

    rv = client.post(
        "/api/comments",
        token=member_token,
        json={
            "message": "Child",
            "objectType": "Line",
            "objectId": str(line_id),
            "parentId": parent_id,
        },
    )
    assert rv.status_code == 201
    res = rv.json
    assert res["parentId"] == parent_id
    assert res.get("rootId") == parent_id
    assert res.get("isDeleted") in (False, None)


def test_update_and_delete_comment(client, member_token):
    line_id = Line.get_id_by_slug("treppe")
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Edit me", "objectType": "Line", "objectId": str(line_id)},
    )
    assert rv.status_code == 201
    comment_id = rv.json["id"]

    rv = client.put(f"/api/comments/{comment_id}", token=member_token, json={"message": "Edited"})
    assert rv.status_code == 200
    assert rv.json["message"] == "Edited"

    rv = client.delete(f"/api/comments/{comment_id}", token=member_token)
    assert rv.status_code == 204


def test_get_comments_for_line(client):
    line_id = Line.get_id_by_slug("treppe")
    rv = client.get(f"/api/comments?object-type=Line&object-id={line_id}&page=1&per-page=100")
    assert rv.status_code == 200
    assert "items" in rv.json


def test_cascade_delete_comments(client, moderator_token, member_token):
    # create a comment on area kreuzfels and then delete area -> comment should be gone
    rv = client.post(
        "/api/sectors/schattental/areas",
        token=moderator_token,
        json={
            "name": "K-Comment",
            "description": "",
            "shortDescription": "",
            "mapMarkers": [],
            "portraitImage": None,
            "secret": False,
            "closed": False,
            "closedReason": None,
            "defaultBoulderScale": None,
            "defaultSportScale": None,
            "defaultTradScale": None,
        },
    )
    assert rv.status_code == 201
    area_id = Area.get_id_by_slug("k-comment")

    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Area comment", "objectType": "Area", "objectId": str(area_id)},
    )
    assert rv.status_code == 201

    rv = client.delete("/api/areas/k-comment", token=moderator_token)
    assert rv.status_code == 204

    # Fetch comments for deleted area -> should be empty
    rv = client.get(f"/api/comments?object-type=Area&object-id={area_id}&page=1&per-page=100")
    assert rv.status_code == 200
    assert rv.json["items"] == []


def test_create_comment_missing_fields_returns_400(client, member_token):
    # Missing objectType and objectId
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Hi"},
    )
    assert rv.status_code == 400


def test_create_comment_invalid_object_type_returns_400(client, member_token):
    line_id = str(Line.get_id_by_slug("treppe"))
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Hi", "objectType": "Foo", "objectId": line_id},
    )
    assert rv.status_code == 400


def test_create_comment_empty_message_returns_400(client, member_token):
    line_id = str(Line.get_id_by_slug("treppe"))
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "", "objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 400


def test_update_comment_empty_message_returns_400(client, member_token):
    # Create first
    line_id = str(Line.get_id_by_slug("treppe"))
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "To edit", "objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 201
    comment_id = rv.json["id"]

    # Update with empty message
    rv = client.put(f"/api/comments/{comment_id}", token=member_token, json={"message": ""})
    assert rv.status_code == 400


def test_reply_mismatched_parent_raises_bad_request(client, member_token):
    # Create a parent on super-spreader
    line_a = str(Line.get_id_by_slug("super-spreader"))
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Parent A", "objectType": "Line", "objectId": line_a},
    )
    assert rv.status_code == 201
    parent_id = rv.json["id"]

    # Try to reply on a different line using parent from A
    line_b = str(Line.get_id_by_slug("treppe"))
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={
            "message": "Reply",
            "objectType": "Line",
            "objectId": line_b,
            "parentId": parent_id,
        },
    )
    assert rv.status_code == 400
    assert rv.json["message"] == "Reply must reference the same target object as its parent comment."


def test_create_comment_on_nonexistent_object_returns_404(client, member_token):
    import uuid

    fake_id = str(uuid.uuid4())
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Hi", "objectType": "Line", "objectId": fake_id},
    )
    assert rv.status_code == 404
    from messages.messages import ResponseMessage

    assert rv.json["message"] == ResponseMessage.ENTITY_NOT_FOUND.value


def test_unauthorized_edit_by_other_user_returns_401(client, member_token, user_token):
    line_id = str(Line.get_id_by_slug("treppe"))
    # Create by member
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Mine", "objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 201
    comment_id = rv.json["id"]

    # Try to edit by another user
    rv = client.put(f"/api/comments/{comment_id}", token=user_token, json={"message": "Hacked"})
    assert rv.status_code == 401
    assert rv.json["message"] == "Only the creator can edit the comment."


def test_unauthorized_delete_by_other_user_returns_401(client, member_token, user_token):
    line_id = str(Line.get_id_by_slug("treppe"))
    # Create by member
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Mine", "objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 201
    comment_id = rv.json["id"]

    # Try to delete by another non-moderator user
    rv = client.delete(f"/api/comments/{comment_id}", token=user_token)
    assert rv.status_code == 401
    assert rv.json["message"] == "Only the creator or a moderator can delete the comment."


def test_create_comment_on_secret_area_returns_404_for_non_member(client, moderator_token, user_token):
    # Create a secret area
    rv = client.post(
        "/api/sectors/schattental/areas",
        token=moderator_token,
        json={
            "name": "Secret-Area",
            "description": "",
            "shortDescription": "",
            "mapMarkers": [],
            "portraitImage": None,
            "secret": True,
            "closed": False,
            "closedReason": None,
            "defaultBoulderScale": None,
            "defaultSportScale": None,
            "defaultTradScale": None,
        },
    )
    assert rv.status_code == 201
    area_id = str(Area.get_id_by_slug("secret-area"))

    # Try to comment as a non-member (no secret access)
    rv = client.post(
        "/api/comments",
        token=user_token,
        json={"message": "Shh", "objectType": "Area", "objectId": area_id},
    )
    assert rv.status_code == 404
    from messages.messages import ResponseMessage

    assert rv.json["message"] == ResponseMessage.ENTITY_NOT_FOUND.value


def test_create_comment_requires_auth_returns_401(client):
    line_id = str(Line.get_id_by_slug("treppe"))
    rv = client.post(
        "/api/comments",
        json={"message": "Hi", "objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 401
    from messages.messages import ResponseMessage

    assert rv.json["message"] == ResponseMessage.UNAUTHORIZED.value


def test_update_comment_not_found_returns_404(client, member_token):
    import uuid

    fake_id = str(uuid.uuid4())
    rv = client.put(f"/api/comments/{fake_id}", token=member_token, json={"message": "X"})
    assert rv.status_code == 404
    from messages.messages import ResponseMessage

    assert rv.json["message"] == ResponseMessage.ENTITY_NOT_FOUND.value


def test_get_only_root_level_comments_and_reply_count(client, member_token):
    # Arrange: create a parent and two replies on the same line
    line_id = str(Line.get_id_by_slug("treppe"))
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Root", "objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 201
    parent_id = rv.json["id"]

    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Reply 1", "objectType": "Line", "objectId": line_id, "parentId": parent_id},
    )
    assert rv.status_code == 201

    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Reply 2", "objectType": "Line", "objectId": line_id, "parentId": parent_id},
    )
    assert rv.status_code == 201

    # Act: fetch top-level comments
    rv = client.get(f"/api/comments?object-type=Line&object-id={line_id}&page=1&per-page=100")
    assert rv.status_code == 200
    items = rv.json["items"]

    # Assert: Only root-level comments are returned and replyCount is correct
    assert any(item["id"] == parent_id for item in items)
    parent = next(item for item in items if item["id"] == parent_id)
    assert parent["replyCount"] == 2
    assert parent.get("rootId") is None
    # Ensure no direct child reply appears in the root-level list
    assert not any(item.get("parentId") == parent_id and item["id"] != parent_id for item in items)


def test_get_replies_for_comment(client, member_token):
    line_id = str(Line.get_id_by_slug("treppe"))
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Root", "objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 201
    parent_id = rv.json["id"]

    for i in range(2):
        rv = client.post(
            "/api/comments",
            token=member_token,
            json={"message": f"Reply {i+1}", "objectType": "Line", "objectId": line_id, "parentId": parent_id},
        )
        assert rv.status_code == 201

    rv = client.get(f"/api/comments?root-id={parent_id}&page=1&per-page=100")
    assert rv.status_code == 200
    items = rv.json["items"]

    assert len(items) == 2
    assert all(item.get("parentId") == parent_id for item in items)
    assert all(item.get("rootId") == parent_id for item in items)
    assert all("replyCount" not in item for item in items)


def test_reply_to_reply_sets_root_id(client, member_token):
    line_id = str(Line.get_id_by_slug("treppe"))
    # Create root comment
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Root", "objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 201
    root_id = rv.json["id"]
    assert rv.json.get("rootId") is None

    # First reply
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Child", "objectType": "Line", "objectId": line_id, "parentId": root_id},
    )
    assert rv.status_code == 201
    child_id = rv.json["id"]
    assert rv.json.get("rootId") == root_id

    # Reply to the reply
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Grandchild", "objectType": "Line", "objectId": line_id, "parentId": child_id},
    )
    assert rv.status_code == 201
    # Grandchild's rootId still equals the top-level root
    assert rv.json.get("rootId") == root_id


# New tests for soft/hard delete behavior


def test_delete_comment_with_replies_is_soft_deleted(client, member_token):
    line_id = str(Line.get_id_by_slug("treppe"))
    # Create parent and a reply
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Parent to be soft-deleted", "objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 201
    parent_id = rv.json["id"]

    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Reply", "objectType": "Line", "objectId": line_id, "parentId": parent_id},
    )
    assert rv.status_code == 201

    # Delete parent -> should be soft-deleted
    rv = client.delete(f"/api/comments/{parent_id}", token=member_token)
    assert rv.status_code == 204

    # Fetch top-level comments
    rv = client.get(f"/api/comments?object-type=Line&object-id={line_id}&page=1&per-page=100")
    assert rv.status_code == 200
    items = rv.json["items"]
    # Parent should still exist but message cleared and author removed
    parent = next(i for i in items if i["id"] == parent_id)
    assert parent["message"] is None
    assert parent.get("createdBy") is None
    assert parent["isDeleted"] is True
    assert parent["replyCount"] == 1

    # Replies should still be retrievable
    rv = client.get(f"/api/comments?root-id={parent_id}&page=1&per-page=100")
    assert rv.status_code == 200
    assert len(rv.json["items"]) == 1


def test_delete_comment_without_replies_is_hard_deleted(client, member_token):
    line_id = str(Line.get_id_by_slug("treppe"))
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "To be hard deleted", "objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 201
    comment_id = rv.json["id"]

    # Delete
    rv = client.delete(f"/api/comments/{comment_id}", token=member_token)
    assert rv.status_code == 204

    # Should not be in top-level list anymore
    rv = client.get(f"/api/comments?object-type=Line&object-id={line_id}&page=1&per-page=100")
    assert rv.status_code == 200
    assert not any(item["id"] == comment_id for item in rv.json["items"])


def test_delete_child_comment_does_not_affect_parent(client, member_token):
    line_id = str(Line.get_id_by_slug("treppe"))
    # Create parent and a reply
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Parent stays", "objectType": "Line", "objectId": line_id},
    )
    assert rv.status_code == 201
    parent_id = rv.json["id"]

    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Child to delete", "objectType": "Line", "objectId": line_id, "parentId": parent_id},
    )
    assert rv.status_code == 201
    child_id = rv.json["id"]

    # Delete child -> hard delete
    rv = client.delete(f"/api/comments/{child_id}", token=member_token)
    assert rv.status_code == 204

    # Parent should remain and replyCount should be 0 now
    rv = client.get(f"/api/comments?object-type=Line&object-id={line_id}&page=1&per-page=100")
    assert rv.status_code == 200
    parent = next(i for i in rv.json["items"] if i["id"] == parent_id)
    assert parent["replyCount"] == 0


def test_admins_receive_email_on_new_comment(client, user_token, smtp_mock):
    line_id = Line.get_id_by_slug("treppe")
    rv = client.post(
        "/api/comments",
        token=user_token,
        json={"message": "Admin notify", "objectType": "Line", "objectId": str(line_id)},
    )
    assert rv.status_code == 201, rv.text
    # Expect exactly one email (to the single admin)
    assert smtp_mock.return_value.__enter__.return_value.login.call_count == 1
    assert smtp_mock.return_value.__enter__.return_value.sendmail.call_count == 1
    assert smtp_mock.return_value.__enter__.return_value.quit.call_count == 1


def test_parent_receives_email_on_reply(client, member_token, smtp_mock):
    line_id = Line.get_id_by_slug("treppe")
    rv = client.post(
        "/api/comments",
        token=member_token,
        json={"message": "Root email", "objectType": "Line", "objectId": str(line_id)},
    )
    assert rv.status_code == 201, rv.text
    root_id = rv.json["id"]

    from flask_jwt_extended import create_access_token

    admin_token = create_access_token(
        identity="admin@localcrag.invalid.org",
        additional_claims={"admin": True, "moderator": True, "member": True},
    )
    rv = client.post(
        "/api/comments",
        token=admin_token,
        json={
            "message": "Reply email",
            "objectType": "Line",
            "objectId": str(line_id),
            "parentId": root_id,
        },
    )
    assert rv.status_code == 201, rv.text

    # Two emails total: first to admin on root creation, second to parent on reply
    assert smtp_mock.return_value.__enter__.return_value.login.call_count == 2
    assert smtp_mock.return_value.__enter__.return_value.sendmail.call_count == 2
    assert smtp_mock.return_value.__enter__.return_value.quit.call_count == 2
