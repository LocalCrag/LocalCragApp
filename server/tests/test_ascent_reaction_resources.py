from models.ascent import Ascent
from models.enums.notification_type_enum import NotificationTypeEnum
from models.notification import Notification


def test_ascents_include_reactions_empty_by_default(client):
    rv = client.get("/api/ascents?page=1")
    assert rv.status_code == 200
    res = rv.json
    assert "items" in res
    # Example of generic nature: ascents always expose reactions map
    for item in res["items"]:
        assert "reactions" in item
        assert item["reactions"] == []


def test_reaction_post_put_delete_on_ascent(client, member_token):
    ascent = Ascent.query.first()

    # PUT must fail if no reaction exists
    rv = client.put(
        f"/api/reactions/ascent/{ascent.id}",
        token=member_token,
        json={"emoji": "💪"},
    )
    assert rv.status_code == 404

    # POST create
    rv = client.post(
        f"/api/reactions/ascent/{ascent.id}",
        token=member_token,
        json={"emoji": "🔥"},
    )
    assert rv.status_code == 201
    assert isinstance(rv.json, list)
    assert len(rv.json) == 1
    assert rv.json[0]["emoji"] == "🔥"
    assert rv.json[0]["user"]["id"]
    assert (
        Notification.query.filter(
            Notification.type == NotificationTypeEnum.REACTION, Notification.entity_id == ascent.id
        ).count()
        == 1
    )

    # Ascents list should now expose aggregated counts
    rv = client.get("/api/ascents?page=1")
    assert rv.status_code == 200
    item = next(i for i in rv.json["items"] if i["id"] == str(ascent.id))
    assert len(item["reactions"]) == 1
    assert item["reactions"][0]["emoji"] == "🔥"
    assert item["reactions"][0]["user"]["id"]

    # PUT change (to another allowed emoji)
    rv = client.put(
        f"/api/reactions/ascent/{ascent.id}",
        token=member_token,
        json={"emoji": "💪"},
    )
    assert rv.status_code == 200
    assert isinstance(rv.json, list)
    assert len(rv.json) == 1
    assert rv.json[0]["emoji"] == "💪"

    rv = client.get("/api/ascents?page=1")
    item = next(i for i in rv.json["items"] if i["id"] == str(ascent.id))
    assert len(item["reactions"]) == 1
    assert item["reactions"][0]["emoji"] == "💪"

    # DELETE
    rv = client.delete(f"/api/reactions/ascent/{ascent.id}", token=member_token)
    assert rv.status_code == 200
    assert rv.json == []

    rv = client.get("/api/ascents?page=1")
    item = next(i for i in rv.json["items"] if i["id"] == str(ascent.id))
    assert item["reactions"] == []


def test_reaction_invalid_emoji(client, member_token):
    ascent = Ascent.query.first()
    rv = client.post(
        f"/api/reactions/ascent/{ascent.id}",
        token=member_token,
        json={"emoji": "❌"},
    )
    assert rv.status_code == 400


def test_reaction_unsupported_target_type(client, member_token):
    ascent = Ascent.query.first()
    rv = client.post(
        f"/api/reactions/line/{ascent.id}",
        token=member_token,
        json={"emoji": "🔥"},
    )
    assert rv.status_code == 400


def test_cannot_react_to_own_ascent(client, admin_token):
    # admin_token belongs to the "admin" user; pick one of their ascents
    ascent = Ascent.query.filter(Ascent.created_by.has(email="admin@localcrag.invalid.org")).first()
    assert ascent is not None

    rv = client.post(
        f"/api/reactions/ascent/{ascent.id}",
        token=admin_token,
        json={"emoji": "🔥"},
    )
    assert rv.status_code == 400

    rv = client.put(
        f"/api/reactions/ascent/{ascent.id}",
        token=admin_token,
        json={"emoji": "💪"},
    )
    assert rv.status_code == 400
