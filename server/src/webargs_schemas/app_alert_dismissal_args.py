from webargs import fields

mark_app_alert_dismissed_args = {
    "alertId": fields.Str(required=True),
}
