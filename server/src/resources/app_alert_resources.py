from flask import jsonify, request
from flask.views import MethodView
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.app_alert_schema import app_alert_schema, app_alerts_schema
from models.app_alert import AppAlert
from models.enums.app_alert_severity_enum import AppAlertSeverityEnum
from models.user import User
from util.auth_session import (
    get_current_user,
    get_session_identity,
    session_required,
    verify_session_in_request,
)
from webargs_schemas.app_alert_args import app_alert_args


class GetAppAlerts(MethodView):
    def get(self):
        """
        Returns currently active app alerts. When the caller is logged in,
        dismissed alerts are excluded server-side.
        """
        verify_session_in_request(optional=True)
        user = get_current_user()
        if user:
            alerts = AppAlert.return_active_for_user(user.id)
        else:
            alerts = AppAlert.return_active()
        return jsonify(app_alerts_schema.dump(alerts)), 200


class GetAllAppAlerts(MethodView):
    @session_required(admin=True)
    def get(self):
        """
        Returns all app alerts for admin management.
        """
        alerts = AppAlert.return_all(order_by=lambda: AppAlert.starts_at.desc())
        return jsonify(app_alerts_schema.dump(alerts)), 200


class GetAppAlert(MethodView):
    @session_required(admin=True)
    def get(self, alert_id):
        """
        Returns a single app alert.
        """
        alert = AppAlert.find_by_id(alert_id)
        return app_alert_schema.dump(alert), 200


class CreateAppAlert(MethodView):
    @session_required(admin=True)
    def post(self):
        """
        Create an app alert.
        """
        data = parser.parse(app_alert_args, request)
        created_by = User.find_by_email(get_session_identity())

        alert = AppAlert()
        alert.message = data["message"].strip()
        alert.severity = AppAlertSeverityEnum(data["severity"])
        alert.read_more_url = (data.get("readMoreUrl") or "").strip() or None
        alert.starts_at = data["startsAt"]
        alert.ends_at = data["endsAt"]
        alert.created_by_id = created_by.id

        db.session.add(alert)
        db.session.commit()

        return app_alert_schema.dump(alert), 201


class UpdateAppAlert(MethodView):
    @session_required(admin=True)
    def put(self, alert_id):
        """
        Update an app alert.
        """
        data = parser.parse(app_alert_args, request)
        alert = AppAlert.find_by_id(alert_id)

        alert.message = data["message"].strip()
        alert.severity = AppAlertSeverityEnum(data["severity"])
        alert.read_more_url = (data.get("readMoreUrl") or "").strip() or None
        alert.starts_at = data["startsAt"]
        alert.ends_at = data["endsAt"]

        db.session.add(alert)
        db.session.commit()

        return app_alert_schema.dump(alert), 200


class DeleteAppAlert(MethodView):
    @session_required(admin=True)
    def delete(self, alert_id):
        """
        Delete an app alert.
        """
        alert = AppAlert.find_by_id(alert_id)
        db.session.delete(alert)
        db.session.commit()
        return jsonify(None), 204
