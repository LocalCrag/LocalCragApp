import uuid

from sqlalchemy.dialects.postgresql import JSON, UUID

from extensions import db
from models.enums.line_type_enum import LineTypeEnum


class Ranking(db.Model):
    __tablename__ = "rankings"

    id = db.Column(UUID(), default=lambda u: uuid.uuid4(), unique=True, primary_key=True)
    crag_id = db.Column(UUID(), db.ForeignKey("crags.id"), nullable=True)
    sector_id = db.Column(UUID(), db.ForeignKey("sectors.id"), nullable=True)
    user_id = db.Column(UUID(), db.ForeignKey("users.id"), nullable=False)
    user = db.relationship("User", lazy="joined", overlaps="rankings")
    top_10 = db.Column(db.Integer(), default=0)
    top_50 = db.Column(db.Integer(), default=0)
    top_values = db.Column(JSON)
    total_count = db.Column(db.Integer(), default=0)
    type = db.Column(db.Enum(LineTypeEnum), nullable=False)
    secret = db.Column(db.Boolean(), nullable=False, server_default="0")

    @classmethod
    def return_all(cls):
        return cls.query.all()

    @classmethod
    def return_all_for_user(cls, user_id):
        return cls.query.filter_by(user_id=user_id).all()

    @classmethod
    def get_new_ranking(cls, user_id, type, crag_id=None, sector_id=None, secret=False):
        ranking = Ranking()
        ranking.user_id = user_id
        ranking.type = type
        ranking.crag_id = crag_id
        ranking.sector_id = sector_id
        ranking.top_values = []
        ranking.total = 0
        ranking.total_count = 0
        ranking.secret = secret
        return ranking

    def reset(self):
        self.top_values = []
        self.total_count = 0
