from enum import Enum


class MapMarkerType(Enum):
    """
    All possible types of map markers.
    """
    TOPO_IMAGE = 'TOPO_IMAGE'
    AREA = 'AREA'
    SECTOR = 'SECTOR'
    CRAG = 'CRAG'
    PARKING = 'PARKING'
    ACCESS_POINT = 'ACCESS_POINT'
    OTHER = 'OTHER'
