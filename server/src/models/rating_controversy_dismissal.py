import uuid

from sqlalchemy.dialects.postgresql import UUID

from extensions import db


class RatingControversyDismissal(db.Model):
    """A confirmed controversy that stays hidden while its gap is unchanged.

    ``gap`` is the community value minus the author value. A null gap means the
    community star rating was missing. The row matches, and the line stays out
    of the list, only while the current gap is still that value.
    """

    __tablename__ = "rating_controversy_dismissals"

    id = db.Column(UUID(), default=lambda: uuid.uuid4(), primary_key=True)
    line_id = db.Column(UUID(), db.ForeignKey("lines.id", ondelete="CASCADE"), nullable=False)
    kind = db.Column(db.String(16), nullable=False)
    gap = db.Column(db.Integer, nullable=True)

    __table_args__ = (db.UniqueConstraint("line_id", "kind", name="uq_rating_controversy_dismissals_line_kind"),)
