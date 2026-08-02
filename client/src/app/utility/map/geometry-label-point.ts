import { Geometry } from 'geojson';

/**
 * Representative point for labeling a geometry.
 * Points use their coordinate; polygons use the ring centroid (excluding the closing vertex).
 */
export function geometryLabelPoint(
  geometry: Geometry,
): [number, number] | null {
  if (geometry.type === 'Point') {
    return geometry.coordinates as [number, number];
  }
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0] ?? [];
    const points = ring.length > 1 ? ring.slice(0, -1) : ring;
    if (points.length === 0) {
      return null;
    }
    let sumLng = 0;
    let sumLat = 0;
    for (const point of points) {
      sumLng += point[0];
      sumLat += point[1];
    }
    return [sumLng / points.length, sumLat / points.length];
  }
  return null;
}
