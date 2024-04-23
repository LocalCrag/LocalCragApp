import uuid
from sqlalchemy.dialects.postgresql import UUID, JSON

from extensions import db
from models.enums.line_type_enum import LineTypeEnum


class Ranking(db.Model):
    __tablename__ = 'rankings'

    id = db.Column(UUID(), default=lambda u: str(uuid.uuid4()), unique=True, primary_key=True)
    crag_id = db.Column(UUID(), db.ForeignKey('crags.id'), nullable=True)
    sector_id = db.Column(UUID(), db.ForeignKey('sectors.id'), nullable=True)
    user_id = db.Column(UUID(), db.ForeignKey('users.id'), nullable=False)
    user = db.relationship('User', lazy='joined')
    top_10 = db.Column(db.Integer(), default=0)
    top_10_exponential = db.Column(db.Integer(), default=0)
    top_25 = db.Column(db.Integer(), default=0)
    top_25_exponential = db.Column(db.Integer(), default=0)
    top_values = db.Column(JSON)
    top_fa_values = db.Column(JSON)
    top_10_fa = db.Column(db.Integer(), default=0)
    top_10_fa_exponential = db.Column(db.Integer(), default=0)
    total = db.Column(db.Integer(), default=0)
    total_count = db.Column(db.Integer(), default=0)
    total_exponential = db.Column(db.Integer(), default=0)
    total_fa = db.Column(db.Integer(), default=0)
    total_fa_count = db.Column(db.Integer(), default=0)
    total_fa_exponential = db.Column(db.Integer(), default=0)
    type = db.Column(db.Enum(LineTypeEnum), nullable=False)

    @classmethod
    def find_for_user(cls, user_id, type, crag_id=None, sector_id=None, ):
        query = cls.query.filter_by(user_id=user_id).filter_by(type=type).filter_by(crag_id=crag_id).filter_by(
            sector_id=sector_id)
        ranking = query.first()
        if not ranking:
            ranking = Ranking()
            ranking.user_id = user_id
            ranking.type = type
            ranking.crag_id = crag_id
            ranking.sector_id = sector_id
            ranking.top_values = []
            ranking.top_fa_values = []
            ranking.total = 0
            ranking.total_exponential = 0
            ranking.total_count = 0
            ranking.total_fa = 0
            ranking.total_fa_exponential = 0
            ranking.total_fa_count = 0
        return ranking

    @classmethod
    def return_all(cls):
        return cls.query.all()
