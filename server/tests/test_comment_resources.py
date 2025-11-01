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
    assert res["object"]["id"] == str(line_id)


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
    rv = client.get(f"/api/comments?object_type=Line&object_id={line_id}&page=1&per_page=100")
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
    rv = client.get(f"/api/comments?object_type=Area&object_id={area_id}&page=1&per_page=100")
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
