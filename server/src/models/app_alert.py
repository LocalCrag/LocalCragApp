import datetime

import pytz
from sqlalchemy import and_, func, or_

from extensions import db
from models.base_entity import BaseEntity
from models.enums.app_alert_severity_enum import AppAlertSeverityEnum

EPOCH = datetime.datetime(1970, 1, 1, tzinfo=pytz.utc)


class AppAlert(BaseEntity):
    """
    Instance-wide banner alert shown in the site header for a configured period.
    """

    __tablename__ = "app_alerts"

    message = db.Column(db.String(500), nullable=False)
    severity = db.Column(
        db.Enum(
            AppAlertSeverityEnum,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
            name="app_alert_severity_enum",
        ),
        nullable=False,
        default=AppAlertSeverityEnum.INFO,
    )
    read_more_url = db.Column(db.String(500), nullable=True)
    starts_at = db.Column(db.DateTime(), nullable=False)
    ends_at = db.Column(db.DateTime(), nullable=False)

    @classmethod
    def return_active(cls, now: datetime.datetime | None = None) -> list["AppAlert"]:
        if now is None:
            now = datetime.datetime.now(pytz.utc)
        return cls.query.filter(cls.starts_at <= now, cls.ends_at >= now).order_by(cls.starts_at.desc()).all()

    @classmethod
    def return_active_for_user(cls, user_id, now: datetime.datetime | None = None) -> list["AppAlert"]:
        """
        Active alerts excluding those dismissed by the user, unless the alert
        was updated after dismissal.
        """
        from models.app_alert_dismissal import AppAlertDismissal

        if now is None:
            now = datetime.datetime.now(pytz.utc)

        effective_updated = func.coalesce(cls.time_updated, EPOCH)

        return (
            cls.query.outerjoin(
                AppAlertDismissal,
                and_(
                    AppAlertDismissal.alert_id == cls.id,
                    AppAlertDismissal.user_id == user_id,
                ),
            )
            .filter(cls.starts_at <= now, cls.ends_at >= now)
            .filter(
                or_(
                    AppAlertDismissal.id.is_(None),
                    effective_updated > AppAlertDismissal.dismissed_at,
                )
            )
            .order_by(cls.starts_at.desc())
            .all()
        )
