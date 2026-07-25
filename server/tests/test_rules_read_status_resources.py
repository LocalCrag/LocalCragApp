from models.crag import Crag
from models.rules_read_status import RulesReadStatus
from models.user import User


def test_mark_rules_read_creates_new_row(client, member_token):
    crag = Crag.find_by_slug("brione")
    member = User.find_by_email("member@localcrag.invalid.org")

    assert RulesReadStatus.query.filter_by(user_id=member.id, entity_type="Crag", entity_id=crag.id).first() is None

    rv = client.post(
        "/api/account/rules-read-status",
        token=member_token,
        json={
            "entityType": "Crag",
            "entityId": str(crag.id),
            "acknowledgedRulesUpdatedAt": "2026-07-24T12:00:00+00:00",
        },
    )
    assert rv.status_code == 204, rv.text

    row = RulesReadStatus.query.filter_by(user_id=member.id, entity_type="Crag", entity_id=crag.id).first()
    assert row is not None
    assert row.read_at is not None
    assert row.acknowledged_rules_updated_at is not None


def test_mark_rules_read_upserts_existing_row(client, member_token):
    crag = Crag.find_by_slug("brione")
    member = User.find_by_email("member@localcrag.invalid.org")

    rv = client.post(
        "/api/account/rules-read-status",
        token=member_token,
        json={
            "entityType": "Crag",
            "entityId": str(crag.id),
            "acknowledgedRulesUpdatedAt": "2026-07-24T12:00:00+00:00",
        },
    )
    assert rv.status_code == 204, rv.text
    first_read_at = (
        RulesReadStatus.query.filter_by(user_id=member.id, entity_type="Crag", entity_id=crag.id).first().read_at
    )

    rv = client.post(
        "/api/account/rules-read-status",
        token=member_token,
        json={
            "entityType": "Crag",
            "entityId": str(crag.id),
            "acknowledgedRulesUpdatedAt": "2026-07-25T08:00:00+00:00",
        },
    )
    assert rv.status_code == 204, rv.text

    rows = RulesReadStatus.query.filter_by(user_id=member.id, entity_type="Crag", entity_id=crag.id).all()
    assert len(rows) == 1
    assert rows[0].read_at >= first_read_at
    assert rows[0].acknowledged_rules_updated_at is not None


def test_mark_rules_read_rejects_invalid_entity_type(client, member_token):
    crag = Crag.find_by_slug("brione")

    rv = client.post(
        "/api/account/rules-read-status",
        token=member_token,
        json={
            "entityType": "InvalidType",
            "entityId": str(crag.id),
            "acknowledgedRulesUpdatedAt": None,
        },
    )
    assert rv.status_code == 400


def test_mark_rules_read_unauthorized(client):
    crag = Crag.find_by_slug("brione")

    rv = client.post(
        "/api/account/rules-read-status",
        json={
            "entityType": "Crag",
            "entityId": str(crag.id),
            "acknowledgedRulesUpdatedAt": None,
        },
    )
    assert rv.status_code == 401


def test_get_rules_read_status_returns_only_own_rows(client, member_token, moderator_token):
    crag = Crag.find_by_slug("brione")
    member = User.find_by_email("member@localcrag.invalid.org")

    rv = client.post(
        "/api/account/rules-read-status",
        token=member_token,
        json={
            "entityType": "Crag",
            "entityId": str(crag.id),
            "acknowledgedRulesUpdatedAt": "2026-07-24T12:00:00+00:00",
        },
    )
    assert rv.status_code == 204, rv.text

    rv = client.get("/api/account/rules-read-status", token=member_token)
    assert rv.status_code == 200, rv.text
    res = rv.json
    assert len(res) == 1
    assert res[0]["entityType"] == "Crag"
    assert res[0]["entityId"] == str(crag.id)
    assert res[0]["readAt"] is not None
    assert res[0]["acknowledgedRulesUpdatedAt"] is not None

    rv = client.get("/api/account/rules-read-status", token=moderator_token)
    assert rv.status_code == 200, rv.text
    assert rv.json == []

    other = User.find_by_email("moderator@localcrag.invalid.org")
    assert other.id != member.id


def test_get_rules_read_status_unauthorized(client):
    rv = client.get("/api/account/rules-read-status")
    assert rv.status_code == 401
