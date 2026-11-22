from extensions import db


class CondicasterCache(db.Model):
    """Cached CondiCaster conditions for one crag id.

    Page views read this table. The hourly job is the only writer that calls
    the CondiCaster API.
    """

    __tablename__ = "condicaster_cache"

    condicaster_crag_id = db.Column(db.Integer, primary_key=True)
    timezone = db.Column(db.String(64), nullable=True)
    current_condiscore = db.Column(db.Numeric(4, 2), nullable=True)
    current_valid_at = db.Column(db.DateTime, nullable=True)
    hourly_date = db.Column(db.Date, nullable=True)
    hourly_json = db.Column(db.JSON, nullable=True)
    daily_json = db.Column(db.JSON, nullable=True)
    hourly_fetched_at = db.Column(db.DateTime, nullable=True)
    forecast_hourly_fetched_at = db.Column(db.DateTime, nullable=True)
    daily_fetched_at = db.Column(db.DateTime, nullable=True)
    last_error = db.Column(db.String(32), nullable=True)
