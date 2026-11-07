import uuid

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.schema import CheckConstraint, UniqueConstraint

from extensions import db
from models.base_entity import BaseEntity


class Video(BaseEntity):
    """One playable video. A line has many. An ascent has one."""

    __tablename__ = "videos"

    line_id = db.Column(UUID(), db.ForeignKey("lines.id", ondelete="CASCADE"), nullable=True, index=True)
    ascent_id = db.Column(UUID(), db.ForeignKey("ascents.id", ondelete="CASCADE"), nullable=True, index=True)
    order_index = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    url = db.Column(db.Text, nullable=False)
    title = db.Column(db.String(120), nullable=False, default="Video", server_default="Video")
    source = db.Column(db.String(20), nullable=True)
    file_id = db.Column(UUID(), db.ForeignKey("files.id", ondelete="SET NULL"), nullable=True)
    start_seconds = db.Column(db.Integer, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "(line_id IS NOT NULL AND ascent_id IS NULL) OR (line_id IS NULL AND ascent_id IS NOT NULL)",
            name="videos_one_owner",
        ),
        UniqueConstraint(
            "ascent_id",
            name="uq_videos_one_per_ascent",
            deferrable=True,
            initially="DEFERRED",
        ),
    )

    line = db.relationship("Line", back_populates="videos")
    ascent = db.relationship("Ascent", back_populates="video")

    @staticmethod
    def from_dict(data: dict, order_index: int) -> "Video":
        video = Video()
        video.order_index = order_index
        video.url = (data.get("url") or "").strip()
        title = data.get("title") or "Video"
        video.title = title.strip() if isinstance(title, str) else "Video"
        video.title = video.title or "Video"
        video.source = data.get("source")
        start = data.get("startSeconds")
        video.start_seconds = start if isinstance(start, int) and not isinstance(start, bool) else None
        file_id = data.get("fileId")
        if file_id:
            video.file_id = file_id if isinstance(file_id, uuid.UUID) else uuid.UUID(str(file_id))
        return video
