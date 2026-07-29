import { Geometry, Position } from 'geojson';

/** Dedupe positions that are effectively the same map point. */
export function dedupePositions(points: Position[]): Position[] {
  const seen = new Set<string>();
  const unique: Position[] = [];
  for (const point of points) {
    const key = `${point[0].toFixed(6)},${point[1].toFixed(6)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push([point[0], point[1]]);
  }
  return unique;
}

/**
 * Andrew's monotone chain convex hull.
 * Returns hull vertices in counter-clockwise order (not closed).
 */
export function convexHull(points: Position[]): Position[] {
  const pts = dedupePositions(points).sort((a, b) =>
    a[0] === b[0] ? a[1] - b[1] : a[0] - b[0],
  );
  if (pts.length <= 2) {
    return pts;
  }

  const cross = (o: Position, a: Position, b: Position) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: Position[] = [];
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Position[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Build a convex-hull Polygon from overlay anchors (images, parking, path vertices).
 * Requires at least 3 distinct points; otherwise returns null.
 */
export function geometryFromOverlayPoints(points: Position[]): Geometry | null {
  const unique = dedupePositions(points);
  if (unique.length < 3) {
    return null;
  }
  const hull = convexHull(unique);
  if (hull.length < 3) {
    return null;
  }
  return {
    type: 'Polygon',
    coordinates: [[...hull, hull[0]]],
  };
}
