from flask import current_app, jsonify
from flask.views import MethodView

from schedulers import send_notification_digests
from util.flask_environment import development_only


class TriggerNotificationDigestMails(MethodView):
    """Dev-only: run the notification digest mailer immediately."""

    @development_only
    def post(self):
        result = send_notification_digests(
            current_app._get_current_object(),
            respect_digest_schedule=False,
        )
        return jsonify(result), 200
