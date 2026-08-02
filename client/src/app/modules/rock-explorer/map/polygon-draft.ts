import { Feature, FeatureCollection, Geometry, Position } from 'geojson';

/** True if the closed ring from `vertices` has crossing (non-adjacent) edges. */
export function polygonRingSelfIntersects(vertices: Position[]): boolean {
  const n = vertices.length;
  // A triangle cannot self-intersect; bowties need ≥4 vertices.
  if (n < 4) {
    return false;
  }
  for (let i = 0; i < n; i++) {
    const a1 = vertices[i];
    const a2 = vertices[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      // Adjacent edges share a vertex — not a self-intersection.
      if (j === i + 1) {
        continue;
      }
      if (i === 0 && j === n - 1) {
        continue;
      }
      const b1 = vertices[j];
      const b2 = vertices[(j + 1) % n];
      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

function orient(a: Position, b: Position, c: Position): number {
  const value = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (Math.abs(value) < 1e-12) {
    return 0;
  }
  return value > 0 ? 1 : -1;
}

function onSegment(a: Position, b: Position, p: Position): boolean {
  return (
    p[0] <= Math.max(a[0], b[0]) + 1e-12 &&
    p[0] >= Math.min(a[0], b[0]) - 1e-12 &&
    p[1] <= Math.max(a[1], b[1]) + 1e-12 &&
    p[1] >= Math.min(a[1], b[1]) - 1e-12
  );
}

/** Proper intersection or collinear overlap of segments ab and cd. */
function segmentsIntersect(
  a: Position,
  b: Position,
  c: Position,
  d: Position,
): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (o1 !== o2 && o3 !== o4) {
    return true;
  }
  if (o1 === 0 && onSegment(a, b, c)) {
    return true;
  }
  if (o2 === 0 && onSegment(a, b, d)) {
    return true;
  }
  if (o3 === 0 && onSegment(c, d, a)) {
    return true;
  }
  if (o4 === 0 && onSegment(c, d, b)) {
    return true;
  }
  return false;
}

/** Build the interactive polygon draft FeatureCollection (vertices + line + fill). */
export function buildPolygonDraftCollection(
  vertices: Position[],
): FeatureCollection<Geometry> {
  const invalid = polygonRingSelfIntersects(vertices);
  const features: Feature<Geometry>[] = vertices.map((coords, index) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: coords },
    properties: { vertexIndex: index, invalid },
  }));
  if (vertices.length >= 2) {
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: vertices,
      },
      properties: { invalid },
    });
  }
  if (vertices.length >= 3) {
    const first = vertices[0];
    const last = vertices[vertices.length - 1];
    features.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [last, first],
      },
      properties: { invalid, closing: true },
    });
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        // Closing ring uses same vertex refs + first point (MapLibre ok with shared refs).
        coordinates: [[...vertices, first]],
      },
      properties: { invalid },
    });
  }
  return { type: 'FeatureCollection', features };
}

/** Closed polygon ring from draft vertices (includes closing duplicate). */
export function closedPolygonRing(vertices: Position[]): Position[] {
  return [...vertices, vertices[0]];
}

/** Preview unsaved create geometry (optional vertex points for polygons). */
export function buildDraftGeometryPreview(
  geometry: Geometry,
): FeatureCollection<Geometry> {
  const features: Feature[] = [{ type: 'Feature', geometry, properties: {} }];
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0] ?? [];
    for (let i = 0; i < Math.max(ring.length - 1, 0); i++) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: ring[i] },
        properties: {},
      });
    }
  }
  return { type: 'FeatureCollection', features };
}
