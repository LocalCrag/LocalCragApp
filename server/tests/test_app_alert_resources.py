import datetime

import pytz

from models.app_alert_dismissal import AppAlertDismissal
from models.user import User


def _alert_payload(
    message="Scheduled maintenance tonight.",
    severity="warning",
    read_more_url="https://example.com/details",
    starts_at=None,
    ends_at=None,
):
    now = datetime.datetime.now(pytz.utc)
    return {
        "message": message,
        "severity": severity,
        "readMoreUrl": read_more_url,
        "startsAt": (starts_at or now - datetime.timedelta(hours=1)).isoformat(),
        "endsAt": (ends_at or now + datetime.timedelta(days=7)).isoformat(),
    }


def test_successful_create_app_alert(client, admin_token):
    rv = client.post(
        "/api/app-alerts",
        token=admin_token,
        json=_alert_payload(),
    )
    assert rv.status_code == 201
    res = rv.json
    assert res["message"] == "Scheduled maintenance tonight."
    assert res["severity"] == "warning"
    assert res["readMoreUrl"] == "https://example.com/details"
    assert res["id"] is not None


def test_create_app_alert_rejects_invalid_read_more_url(client, admin_token):
    for invalid_url in ("javascript:alert(1)", "ftp://example.com/details", "not-a-url"):
        rv = client.post(
            "/api/app-alerts",
            token=admin_token,
            json=_alert_payload(read_more_url=invalid_url),
        )
        assert rv.status_code == 400


def test_create_app_alert_forbidden_for_moderator(client, moderator_token):
    rv = client.post(
        "/api/app-alerts",
        token=moderator_token,
        json=_alert_payload(),
    )
    assert rv.status_code == 401


def test_get_active_app_alerts_filters_by_date(client, admin_token):
    now = datetime.datetime.now(pytz.utc)
    active_payload = _alert_payload(
        message="Active alert",
        starts_at=now - datetime.timedelta(hours=1),
        ends_at=now + datetime.timedelta(days=1),
    )
    expired_payload = _alert_payload(
        message="Expired alert",
        starts_at=now - datetime.timedelta(days=10),
        ends_at=now - datetime.timedelta(days=1),
    )
    future_payload = _alert_payload(
        message="Future alert",
        starts_at=now + datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=10),
    )

    for payload in (active_payload, expired_payload, future_payload):
        rv = client.post("/api/app-alerts", token=admin_token, json=payload)
        assert rv.status_code == 201

    rv = client.get("/api/app-alerts")
    assert rv.status_code == 200
    messages = [row["message"] for row in rv.json]
    assert messages == ["Active alert"]


def test_get_all_app_alerts_requires_admin(client, admin_token, moderator_token):
    rv = client.post(
        "/api/app-alerts",
        token=admin_token,
        json=_alert_payload(message="Admin alert"),
    )
    assert rv.status_code == 201

    rv = client.get("/api/app-alerts/manage")
    assert rv.status_code == 401

    rv = client.get("/api/app-alerts/manage", token=moderator_token)
    assert rv.status_code == 401

    rv = client.get("/api/app-alerts/manage", token=admin_token)
    assert rv.status_code == 200
    assert len(rv.json) >= 1


def test_successful_edit_and_delete_app_alert(client, admin_token):
    rv = client.post(
        "/api/app-alerts",
        token=admin_token,
        json=_alert_payload(message="Original message"),
    )
    assert rv.status_code == 201
    alert_id = rv.json["id"]

    rv = client.put(
        f"/api/app-alerts/{alert_id}",
        token=admin_token,
        json=_alert_payload(message="Updated message", severity="danger", read_more_url=None),
    )
    assert rv.status_code == 200
    assert rv.json["message"] == "Updated message"
    assert rv.json["severity"] == "danger"
    assert rv.json["readMoreUrl"] is None

    rv = client.delete(f"/api/app-alerts/{alert_id}", token=admin_token)
    assert rv.status_code == 204

    rv = client.get(f"/api/app-alerts/{alert_id}", token=admin_token)
    assert rv.status_code == 404


def test_mark_app_alert_dismissed_creates_row(client, member_token, admin_token):
    rv = client.post(
        "/api/app-alerts",
        token=admin_token,
        json=_alert_payload(),
    )
    assert rv.status_code == 201
    alert_id = rv.json["id"]
    member = User.find_by_email("member@localcrag.invalid.org")

    assert AppAlertDismissal.query.filter_by(user_id=member.id, alert_id=alert_id).first() is None

    rv = client.post(
        "/api/account/app-alert-dismissals",
        token=member_token,
        json={"alertId": alert_id},
    )
    assert rv.status_code == 204

    row = AppAlertDismissal.query.filter_by(user_id=member.id, alert_id=alert_id).first()
    assert row is not None
    assert row.dismissed_at is not None


def test_get_active_app_alerts_excludes_dismissed_for_user(client, member_token, admin_token):
    rv = client.post(
        "/api/app-alerts",
        token=admin_token,
        json=_alert_payload(message="Dismiss me"),
    )
    assert rv.status_code == 201
    alert_id = rv.json["id"]

    rv = client.get("/api/app-alerts", token=member_token)
    assert rv.status_code == 200
    assert len(rv.json) == 1
    assert rv.json[0]["id"] == alert_id

    rv = client.post(
        "/api/account/app-alert-dismissals",
        token=member_token,
        json={"alertId": alert_id},
    )
    assert rv.status_code == 204

    rv = client.get("/api/app-alerts", token=member_token)
    assert rv.status_code == 200
    assert rv.json == []

    rv = client.get("/api/app-alerts")
    assert rv.status_code == 200
    assert len(rv.json) == 1
