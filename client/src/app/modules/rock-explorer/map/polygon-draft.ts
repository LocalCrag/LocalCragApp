import { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import { polygonRingSelfIntersects } from '../../../utility/geometry/polygon-self-intersection';

export { polygonRingSelfIntersects } from '../../../utility/geometry/polygon-self-intersection';

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
