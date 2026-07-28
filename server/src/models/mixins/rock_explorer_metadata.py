from sqlalchemy.dialects.postgresql import JSON

from extensions import db
from models.enums.line_type_enum import LineTypeEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum


class RockExplorerMetadataMixin:
    """Shared title/description/tag columns for rock explorer features."""

    title = db.Column(db.String(120), nullable=True)
    description = db.Column(db.Text, nullable=True)
    potential = db.Column(db.Enum(RockExplorerPotentialEnum), nullable=True)
    rock_quality = db.Column(db.Enum(RockExplorerRockQualityEnum), nullable=True)
    rock_type = db.Column(db.Enum(RockExplorerRockTypeEnum), nullable=True)
    grade_line_type = db.Column(db.Enum(LineTypeEnum), nullable=True)
    grade_scale = db.Column(db.String(32), nullable=True)
    grade_value_min = db.Column(db.Integer, nullable=True)
    grade_value_max = db.Column(db.Integer, nullable=True)
    access_issues = db.Column(JSON, nullable=False, default=lambda: [])
