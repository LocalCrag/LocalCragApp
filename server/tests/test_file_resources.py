def test_update_file_focus(client, any_file, moderator_token):
    rv = client.patch(
        f"/api/files/{any_file.id}",
        token=moderator_token,
        json={"focusY": 0.35},
    )
    assert rv.status_code == 200
    assert rv.json["focusY"] == 0.35


def test_clear_file_focus(client, any_file, moderator_token):
    client.patch(
        f"/api/files/{any_file.id}",
        token=moderator_token,
        json={"focusY": 0.35},
    )
    rv = client.patch(
        f"/api/files/{any_file.id}",
        token=moderator_token,
        json={"focusY": None},
    )
    assert rv.status_code == 200
    assert rv.json["focusY"] is None
