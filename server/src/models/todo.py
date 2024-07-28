from sqlalchemy.dialects.postgresql import UUID

from error_handling.http_exceptions.not_found import NotFound
from extensions import db
from models.base_entity import BaseEntity
from models.enums.todo_priority_enum import TodoPriorityEnum


class Todo(BaseEntity):
    __tablename__ = 'todos'

    crag_id = db.Column(UUID(), db.ForeignKey('crags.id'), nullable=False)
    crag = db.relationship('Crag', lazy='joined')
    sector_id = db.Column(UUID(), db.ForeignKey('sectors.id'), nullable=False)
    sector = db.relationship('Sector', lazy='joined')
    area_id = db.Column(UUID(), db.ForeignKey('areas.id'), nullable=False)
    area = db.relationship('Area', lazy='joined')
    line_id = db.Column(UUID(), db.ForeignKey('lines.id'), nullable=False)
    line = db.relationship('Line', lazy='joined')
    priority = db.Column(db.Enum(TodoPriorityEnum), nullable=False, default=TodoPriorityEnum.MEDIUM)
