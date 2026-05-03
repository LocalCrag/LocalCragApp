from webargs import fields

mark_notifications_read_args = {
    "notificationIds": fields.List(fields.UUID(required=True), required=True),
}
