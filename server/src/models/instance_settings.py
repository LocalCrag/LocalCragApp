import datetime
import uuid
from typing import Self

import pytz
from flask import current_app
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property

from extensions import db
from models.enums.fa_default_format_enum import FaDefaultFormatEnum
from models.enums.starting_position_enum import StartingPositionEnum


class InstanceSettings(db.Model):
    __tablename__ = "instance_settings"

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    time_updated = db.Column(db.DateTime(), onupdate=lambda: datetime.datetime.now(pytz.utc))
    instance_name = db.Column(db.String(120), nullable=False)
    copyright_owner = db.Column(db.String(120), nullable=False)
    logo_image_id = db.Column(UUID(), db.ForeignKey("files.id"), nullable=True)
    logo_image = db.relationship("File", lazy="joined", foreign_keys=[logo_image_id])
    favicon_image_id = db.Column(UUID(), db.ForeignKey("files.id"), nullable=True)
    favicon_image = db.relationship("File", lazy="joined", foreign_keys=[favicon_image_id])
    auth_bg_image_id = db.Column(UUID(), db.ForeignKey("files.id"), nullable=True)
    auth_bg_image = db.relationship("File", lazy="joined", foreign_keys=[auth_bg_image_id])
    main_bg_image_id = db.Column(UUID(), db.ForeignKey("files.id"), nullable=True)
    main_bg_image = db.relationship("File", lazy="joined", foreign_keys=[main_bg_image_id])
    arrow_color = db.Column(db.String(7), nullable=False, server_default="#FFE016")
    arrow_text_color = db.Column(db.String(7), nullable=False, server_default="#000000")
    arrow_highlight_color = db.Column(db.String(7), nullable=False, server_default="#FF0000")
    arrow_highlight_text_color = db.Column(db.String(7), nullable=False, server_default="#FFFFFF")
    bar_chart_color = db.Column(db.String(30), nullable=False, server_default="rgb(213, 30, 38)")
    matomo_tracker_url = db.Column(db.String(120), nullable=True)
    matomo_site_id = db.Column(db.String(120), nullable=True)
    maptiler_api_key = db.Column(db.String(120), nullable=True)
    gym_mode = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    skipped_hierarchical_layers = db.Column(db.Integer, nullable=False, server_default="0")
    display_user_ratings = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    display_user_grades = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    fa_default_format = db.Column(
        db.Enum(FaDefaultFormatEnum), nullable=False, server_default=FaDefaultFormatEnum.YEAR.value
    )
    default_starting_position = db.Column(
        db.Enum(StartingPositionEnum),
        nullable=False,
        default=StartingPositionEnum.STAND,
        server_default=StartingPositionEnum.STAND.value,
    )
    # Number of past weeks to consider for rankings; None means all-time
    ranking_past_weeks = db.Column(db.Integer, nullable=True)
    disable_fa_in_ascents = db.Column(db.Boolean, nullable=False, default=False, server_default="false")

    @hybrid_property
    def superadmin_email(self) -> str:
        return current_app.config["SUPERADMIN_EMAIL"]

    @classmethod
    def return_it(cls) -> Self:
        return cls.query.first()
