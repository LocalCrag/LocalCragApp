from unittest.mock import patch


def test_notification_digest_dev_endpoint_disabled_outside_development(client):
    with patch("util.flask_environment.is_development_mode", return_value=False):
        rv = client.post("/api/dev/notification-digest-mails")
    assert rv.status_code == 404


def test_notification_digest_dev_endpoint_triggers_mailer(client):
    with patch("util.flask_environment.is_development_mode", return_value=True):
        with patch(
            "resources.dev_resources.send_notification_digests",
            return_value={"usersMailed": 1, "notificationsMailed": 3},
        ) as mock_send:
            rv = client.post("/api/dev/notification-digest-mails")
    assert rv.status_code == 200
    assert rv.json == {"usersMailed": 1, "notificationsMailed": 3}
    assert mock_send.call_args.kwargs["respect_digest_schedule"] is False
