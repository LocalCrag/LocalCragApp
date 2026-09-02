import { Geometry, Polygon, Position } from 'geojson';

const EARTH_RADIUS_M = 6378137;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Geodesic area of a ring in square metres (WGS84). */
function ringAreaSqM(coords: Position[]): number {
  const len = coords.length;
  if (len <= 2) {
    return 0;
  }
  let area = 0;
  for (let i = 0; i < len; i++) {
    let lowerIndex: number;
    let middleIndex: number;
    let upperIndex: number;
    if (i === len - 2) {
      lowerIndex = len - 2;
      middleIndex = len - 1;
      upperIndex = 0;
    } else if (i === len - 1) {
      lowerIndex = len - 1;
      middleIndex = 0;
      upperIndex = 1;
    } else {
      lowerIndex = i;
      middleIndex = i + 1;
      upperIndex = i + 2;
    }
    const p1 = coords[lowerIndex];
    const p2 = coords[middleIndex];
    const p3 = coords[upperIndex];
    area += (toRad(p3[0]) - toRad(p1[0])) * Math.sin(toRad(p2[1]));
  }
  return Math.abs((area * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

function polygonAreaSqM(polygon: Polygon): number {
  let area = ringAreaSqM(polygon.coordinates[0] ?? []);
  for (let i = 1; i < polygon.coordinates.length; i++) {
    area -= ringAreaSqM(polygon.coordinates[i] ?? []);
  }
  return Math.max(0, area);
}

/** Returns geodesic area in m² for Polygon features, otherwise null. */
export function geometryAreaSqM(
  geometry: Geometry | null | undefined,
): number | null {
  if (!geometry || geometry.type !== 'Polygon') {
    return null;
  }
  return polygonAreaSqM(geometry);
}
