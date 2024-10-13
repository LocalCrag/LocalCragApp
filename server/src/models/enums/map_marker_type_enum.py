from enum import Enum


class MapMarkerType(Enum):
    """
    All possible types of map markers.
    """

    TOPO_IMAGE = "TOPO_IMAGE"
    AREA = "AREA"
    SECTOR = "SECTOR"
    CRAG = "CRAG"
    PARKING = "PARKING"
    ACCESS_POINT = "ACCESS_POINT"
    OTHER = "OTHER"


disabled_marker_types_crag = {
    MapMarkerType.TOPO_IMAGE,
    MapMarkerType.AREA,
    MapMarkerType.SECTOR,
}

disabled_marker_types_sector = {
    MapMarkerType.CRAG,
    MapMarkerType.TOPO_IMAGE,
    MapMarkerType.AREA,
}

disabled_marker_types_area = {
    MapMarkerType.CRAG,
    MapMarkerType.SECTOR,
    MapMarkerType.TOPO_IMAGE,
}

disabled_marker_types_topo_image = {
    MapMarkerType.CRAG,
    MapMarkerType.SECTOR,
    MapMarkerType.AREA,
    MapMarkerType.PARKING,
    MapMarkerType.ACCESS_POINT,
    MapMarkerType.OTHER,
}
