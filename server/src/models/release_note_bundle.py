import datetime
import uuid

import pytz
from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class ReleaseNoteBundle(db.Model):
    __tablename__ = "release_note_bundles"

    id = db.Column(UUID(), default=lambda: uuid.uuid4(), unique=True, primary_key=True)
    time_created = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.datetime.now(pytz.utc),
        nullable=False,
    )

    items = db.relationship(
        "ReleaseNoteItem",
        back_populates="bundle",
        cascade="all, delete-orphan",
    )
