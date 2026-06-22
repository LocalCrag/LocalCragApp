from flask import current_app, jsonify
from flask.views import MethodView

from scheduler_jobs.notification_digests import send_notification_digests
from util.flask_environment import development_only
from util.scheduled_closure import apply_materialized_closures


class TriggerNotificationDigestMails(MethodView):
    """Dev-only: run the notification digest mailer immediately."""

    @development_only
    def post(self):
        result = send_notification_digests(
            current_app._get_current_object(),
            respect_digest_schedule=False,
        )
        return jsonify(result), 200


class TriggerClosureMaterialization(MethodView):
    """Dev-only: recompute persisted closed flags from closure schedules."""

    @development_only
    def post(self):
        apply_materialized_closures()
        return jsonify({"status": "ok"}), 200
