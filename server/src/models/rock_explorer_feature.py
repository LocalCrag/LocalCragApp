from sqlalchemy import Table
from sqlalchemy.dialects.postgresql import JSON

from extensions import db
from models.base_entity import BaseEntity
from models.mixins.rock_explorer_metadata import RockExplorerMetadataMixin
from models.tag import Tag

rock_explorer_feature_tags = Table(
    "rock_explorer_feature_tags",
    db.metadata,
    db.Column("tag_id", db.ForeignKey("tags.id")),
    db.Column("rock_explorer_feature_id", db.ForeignKey("rock_explorer_features.id")),
)


class RockExplorerFeature(RockExplorerMetadataMixin, BaseEntity):
    """
    A mapped exploration feature (Point or Polygon GeoJSON geometry).
    """

    __tablename__ = "rock_explorer_features"

    geometry = db.Column(JSON, nullable=False)
    parking_sites = db.Column(JSON, nullable=False, default=lambda: [])
    paths = db.Column(JSON, nullable=False, default=lambda: [])

    # Same Tag association pattern as GalleryImage.tags (topo links).
    topo_links = db.relationship(Tag, secondary=rock_explorer_feature_tags)
