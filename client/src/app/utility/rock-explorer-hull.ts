import {
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  Position,
} from 'geojson';

/** ~45 m at mid latitudes — used to give 1-2 point and collinear clusters a clickable footprint. */
export const HULL_DEGENERATE_PADDING_DEGREES = 0.0004;

/**
 * Flattens a geometry into its constituent positions. Points contribute their single
 * coordinate; polygons contribute every vertex of every ring. Anything else contributes none.
 */
export function geometryToPositions(geometry: Geometry): Position[] {
  if (!geometry) {
    return [];
  }
  if (geometry.type === 'Point') {
    return [geometry.coordinates];
  }
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.reduce(
      (positions: Position[], ring) => positions.concat(ring),
      [],
    );
  }
  return [];
}

const cross = (o: Position, a: Position, b: Position): number =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/**
 * Andrew's monotone chain convex hull. Returns a closed ring (first position repeated
 * at the end) of the outer hull points, or an empty array if fewer than 3 non-collinear
 * points are available.
 */
export function convexHull(points: Position[]): Position[] {
  const uniqueByKey = new Map<string, Position>();
  points.forEach((point) => {
    uniqueByKey.set(`${point[0]},${point[1]}`, point);
  });
  const unique = Array.from(uniqueByKey.values()).sort(
    (a, b) => a[0] - b[0] || a[1] - b[1],
  );

  if (unique.length < 3) {
    return [];
  }

  const buildChain = (pts: Position[]): Position[] => {
    const chain: Position[] = [];
    for (const point of pts) {
      while (
        chain.length >= 2 &&
        cross(chain[chain.length - 2], chain[chain.length - 1], point) <= 0
      ) {
        chain.pop();
      }
      chain.push(point);
    }
    return chain;
  };

  const lower = buildChain(unique);
  const upper = buildChain(unique.slice().reverse());

  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));

  if (hull.length < 3) {
    return [];
  }

  return hull.concat([hull[0]]);
}

const paddedBox = (points: Position[]): Position[] => {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs) - HULL_DEGENERATE_PADDING_DEGREES;
  const maxX = Math.max(...xs) + HULL_DEGENERATE_PADDING_DEGREES;
  const minY = Math.min(...ys) - HULL_DEGENERATE_PADDING_DEGREES;
  const maxY = Math.max(...ys) + HULL_DEGENERATE_PADDING_DEGREES;
  return [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
    [minX, minY],
  ];
};

/**
 * Groups features by clusterId and computes one convex-hull polygon per non-empty
 * cluster, falling back to a padded bounding box for degenerate (< 3 non-collinear
 * point) clusters. Features without a clusterId contribute nothing.
 */
export function computeClusterHulls(
  collection: FeatureCollection<Geometry>,
): FeatureCollection<Polygon> {
  const byCluster = new Map<string, Position[]>();

  (collection?.features ?? []).forEach((feature) => {
    const clusterId = feature.properties?.['clusterId'];
    if (clusterId === null || clusterId === undefined || clusterId === '') {
      return;
    }
    const key = String(clusterId);
    const positions = geometryToPositions(feature.geometry);
    byCluster.set(key, (byCluster.get(key) ?? []).concat(positions));
  });

  const features: Feature<Polygon>[] = [];

  byCluster.forEach((points, clusterId) => {
    if (points.length === 0) {
      return;
    }
    let ring = convexHull(points);
    if (ring.length === 0) {
      ring = paddedBox(points);
    }
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [ring],
      },
      properties: { clusterId },
    });
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}
