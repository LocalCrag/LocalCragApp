from extensions import db
from models.entity_type import EntityType


class EntityInstance(db.Model):
    """
    Model of an entity.
    """
    __tablename__ = 'entity_instances'

    id = db.Column(db.Integer, primary_key=True)
    type = db.relationship(EntityType)
    type_id = db.Column(db.Integer, db.ForeignKey('entity_types.id'), nullable=False)
    min_access_level_id = db.Column(db.Integer, db.ForeignKey('access_levels.id'), nullable=True)
    min_access_level = db.relationship('AccessLevel', lazy='joined')

    @classmethod
    def get_by_id(cls, entity_instance_id):
        return cls.query.filter_by(id=entity_instance_id).first()
