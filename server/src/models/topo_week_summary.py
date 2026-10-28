from extensions import db


class TopoWeekSummary(db.Model):
    """Marks a finished week whose moderator summary was already handled.

    ``notified_at`` is set both when a summary is sent and when the week had
    no points, so a quiet week is not announced again the next day.
    """

    __tablename__ = "topo_week_summaries"

    week_start = db.Column(db.Date(), primary_key=True)
    notified_at = db.Column(db.DateTime(), nullable=True)
