export enum MapMarkerType {
  TOPO_IMAGE = 'TOPO_IMAGE',
  AREA = 'AREA',
  SECTOR = 'SECTOR',
  CRAG = 'CRAG',
  PARKING = 'PARKING',
  ACCESS_POINT = 'ACCESS_POINT',
  OTHER = 'OTHER',
}

export const MAP_MARKER_TYPES = [
  /**
   * t(maps.markerList.TOPO_IMAGE)
   */
  MapMarkerType.TOPO_IMAGE,
  /**
   * t(maps.markerList.AREA)
   */
  MapMarkerType.AREA,
  /**
   * t(maps.markerList.SECTOR)
   */
  MapMarkerType.SECTOR,
  /**
   * t(maps.markerList.CRAG)
   */
  MapMarkerType.CRAG,
  /**
   * t(maps.markerList.PARKING)
   */
  MapMarkerType.PARKING,
  /**
   * t(maps.markerList.ACCESS_POINT)
   */
  MapMarkerType.ACCESS_POINT,
  /**
   * t(maps.markerList.OTHER)
   */
  MapMarkerType.OTHER,
];

export const disabledMarkerTypesCrag = [
  MapMarkerType.TOPO_IMAGE,
  MapMarkerType.AREA,
  MapMarkerType.SECTOR,
];

export const disabledMarkerTypesSector = [
  MapMarkerType.CRAG,
  MapMarkerType.TOPO_IMAGE,
  MapMarkerType.AREA,
];

export const disabledMarkerTypesArea = [
  MapMarkerType.CRAG,
  MapMarkerType.SECTOR,
  MapMarkerType.TOPO_IMAGE,
];

export const disabledMarkerTypesTopoImage = [
  MapMarkerType.CRAG,
  MapMarkerType.SECTOR,
  MapMarkerType.AREA,
  MapMarkerType.PARKING,
  MapMarkerType.ACCESS_POINT,
  MapMarkerType.OTHER,
];
