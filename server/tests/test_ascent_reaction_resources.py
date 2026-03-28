from models.ascent import Ascent


def test_ascents_include_reactions_empty_by_default(client):
    rv = client.get("/api/ascents?page=1")
    assert rv.status_code == 200
    res = rv.json
    assert "items" in res
    # Example of generic nature: ascents always expose reactions map
    for item in res["items"]:
        assert "reactions" in item
        assert item["reactions"] == {}


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

    # Ascents list should now expose aggregated counts
    rv = client.get("/api/ascents?page=1")
    assert rv.status_code == 200
    item = next(i for i in rv.json["items"] if i["id"] == str(ascent.id))
    assert item["reactions"] == {"🔥": 1}

    # PUT change (to another allowed emoji)
    rv = client.put(
        f"/api/reactions/ascent/{ascent.id}",
        token=member_token,
        json={"emoji": "💪"},
    )
    assert rv.status_code == 200

    rv = client.get("/api/ascents?page=1")
    item = next(i for i in rv.json["items"] if i["id"] == str(ascent.id))
    assert item["reactions"] == {"💪": 1}

    # DELETE
    rv = client.delete(f"/api/reactions/ascent/{ascent.id}", token=member_token)
    assert rv.status_code == 204

    rv = client.get("/api/ascents?page=1")
    item = next(i for i in rv.json["items"] if i["id"] == str(ascent.id))
    assert item["reactions"] == {}


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
