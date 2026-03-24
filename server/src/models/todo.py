from sqlalchemy.dialects.postgresql import UUID

from extensions import db
from models.base_entity import BaseEntity
from models.enums.todo_priority_enum import TodoPriorityEnum


class Todo(BaseEntity):
    __tablename__ = "todos"

    line_id = db.Column(UUID(), db.ForeignKey("lines.id"), nullable=False)
    line = db.relationship("Line", lazy="joined")
    priority = db.Column(db.Enum(TodoPriorityEnum), nullable=False, default=TodoPriorityEnum.MEDIUM)

    @property
    def area(self):
        return self.line.area if self.line else None

    @property
    def sector(self):
        area = self.area
        return area.sector if area else None

    @property
    def crag(self):
        sector = self.sector
        return sector.crag if sector else None

    @property
    def area_id(self):
        area = self.area
        return area.id if area else None

    @property
    def sector_id(self):
        sector = self.sector
        return sector.id if sector else None

    @property
    def crag_id(self):
        crag = self.crag
        return crag.id if crag else None
