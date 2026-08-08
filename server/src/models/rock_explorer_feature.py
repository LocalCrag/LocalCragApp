from sqlalchemy import Table
from sqlalchemy.dialects.postgresql import JSON

from extensions import db
from models.base_entity import BaseEntity
from models.enums.line_type_enum import LineTypeEnum
from models.enums.rock_explorer_feature_status_enum import RockExplorerFeatureStatusEnum
from models.enums.rock_explorer_potential_enum import RockExplorerPotentialEnum
from models.enums.rock_explorer_rock_quality_enum import RockExplorerRockQualityEnum
from models.enums.rock_explorer_rock_type_enum import RockExplorerRockTypeEnum
from models.tag import Tag

rock_explorer_feature_tags = Table(
    "rock_explorer_feature_tags",
    db.metadata,
    db.Column("tag_id", db.ForeignKey("tags.id")),
    db.Column("rock_explorer_feature_id", db.ForeignKey("rock_explorer_features.id")),
)


class RockExplorerFeature(BaseEntity):
    """
    A mapped exploration feature (Point or Polygon GeoJSON geometry).
    """

    __tablename__ = "rock_explorer_features"

    geometry = db.Column(JSON, nullable=True)
    parking_sites = db.Column(JSON, nullable=False, default=lambda: [])
    paths = db.Column(JSON, nullable=False, default=lambda: [])

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

    status = db.Column(
        db.Enum(
            RockExplorerFeatureStatusEnum,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=RockExplorerFeatureStatusEnum.PUBLISHED,
    )
    recording_device_id = db.Column(db.String(128), nullable=True)
    recording_updated_at = db.Column(db.DateTime(), nullable=True)

    # Same Tag association pattern as GalleryImage.tags (topo links).
    topo_links = db.relationship(Tag, secondary=rock_explorer_feature_tags)
