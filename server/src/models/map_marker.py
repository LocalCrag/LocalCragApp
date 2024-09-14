from extensions import db
from models.base_entity import BaseEntity

from models.enums.map_marker_type_enum import MapMarkerType
from sqlalchemy.dialects.postgresql import UUID



class MapMarker(BaseEntity):
    """
    Model of a map marker. Can mark anything from crag to parking spot.
    """
    __tablename__ = 'map_markers'

    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    type = db.Column(db.Enum(MapMarkerType), nullable=False)
    name = db.Column(db.String(120), nullable=True)
    description = db.Column(db.Text, nullable=True)
    # todo cascade
    crag_id = db.Column(UUID(as_uuid=True), db.ForeignKey('crags.id'), nullable=True)
    sector_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sectors.id'), nullable=True)
    area_id = db.Column(UUID(as_uuid=True), db.ForeignKey('areas.id'), nullable=True)
    topo_image_id = db.Column(UUID(as_uuid=True), db.ForeignKey('topo_images.id'), nullable=True)

    crag = db.relationship('Crag', back_populates='map_markers')
    sector = db.relationship('Sector', back_populates='map_markers')
    area = db.relationship('Area', back_populates='map_markers')
    topo_image = db.relationship('TopoImage', back_populates='map_markers')

