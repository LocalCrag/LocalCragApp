import { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import {
  HULL_DEGENERATE_PADDING_DEGREES,
  computeClusterHulls,
  convexHull,
  geometryToPositions,
} from './rock-explorer-hull';

const point = (
  coordinates: Position,
  properties: Record<string, any> = {},
): Feature<Geometry> => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates },
  properties,
});

const roundRing = (ring: Position[]): Position[] =>
  ring.map((position) => position.map((n) => Number(n.toFixed(6))));

describe('rock-explorer-hull', () => {
  it('convexHull of the 4 corners of a square plus one interior point returns a closed ring of 5 positions containing only the 4 corners', () => {
    const corners: Position[] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    const points: Position[] = [...corners, [5, 5]];

    const ring = convexHull(points);

    expect(ring.length).toBe(5);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    ring.forEach((position) => {
      expect(
        corners.some((c) => c[0] === position[0] && c[1] === position[1]),
      ).toBe(true);
    });
    expect(ring.some((p) => p[0] === 5 && p[1] === 5)).toBe(false);
  });

  it('convexHull of 3 collinear points returns []', () => {
    const ring = convexHull([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);

    expect(ring).toEqual([]);
  });

  it('computeClusterHulls on a collection with one 4-point cluster returns 1 polygon whose properties.clusterId matches', () => {
    const collection: FeatureCollection<Geometry> = {
      type: 'FeatureCollection',
      features: [
        point([0, 0], { clusterId: 'c1' }),
        point([10, 0], { clusterId: 'c1' }),
        point([10, 10], { clusterId: 'c1' }),
        point([0, 10], { clusterId: 'c1' }),
      ],
    };

    const result = computeClusterHulls(collection);

    expect(result.features.length).toBe(1);
    expect(result.features[0].properties.clusterId).toBe('c1');
  });

  it('a cluster with exactly 1 point yields a padded square of 5 positions centred on that point, half-width HULL_DEGENERATE_PADDING_DEGREES', () => {
    const collection: FeatureCollection<Geometry> = {
      type: 'FeatureCollection',
      features: [point([10, 20], { clusterId: 'solo' })],
    };

    const result = computeClusterHulls(collection);

    expect(result.features.length).toBe(1);
    const ring = roundRing(
      result.features[0].geometry.coordinates[0] as Position[],
    );
    const pad = HULL_DEGENERATE_PADDING_DEGREES;
    expect(ring).toEqual([
      [Number((10 - pad).toFixed(6)), Number((20 - pad).toFixed(6))],
      [Number((10 + pad).toFixed(6)), Number((20 - pad).toFixed(6))],
      [Number((10 + pad).toFixed(6)), Number((20 + pad).toFixed(6))],
      [Number((10 - pad).toFixed(6)), Number((20 + pad).toFixed(6))],
      [Number((10 - pad).toFixed(6)), Number((20 - pad).toFixed(6))],
    ]);
  });

  it('a cluster with exactly 2 points yields a padded rectangle enclosing both', () => {
    const collection: FeatureCollection<Geometry> = {
      type: 'FeatureCollection',
      features: [
        point([0, 0], { clusterId: 'pair' }),
        point([10, 10], { clusterId: 'pair' }),
      ],
    };

    const result = computeClusterHulls(collection);

    expect(result.features.length).toBe(1);
    const ring = roundRing(
      result.features[0].geometry.coordinates[0] as Position[],
    );
    const pad = HULL_DEGENERATE_PADDING_DEGREES;
    ring.forEach((p) => {
      expect(p[0]).toBeGreaterThanOrEqual(Number((0 - pad).toFixed(6)));
      expect(p[0]).toBeLessThanOrEqual(Number((10 + pad).toFixed(6)));
      expect(p[1]).toBeGreaterThanOrEqual(Number((0 - pad).toFixed(6)));
      expect(p[1]).toBeLessThanOrEqual(Number((10 + pad).toFixed(6)));
    });
    const minCorner = [
      Number((0 - pad).toFixed(6)),
      Number((0 - pad).toFixed(6)),
    ];
    const maxCorner = [
      Number((10 + pad).toFixed(6)),
      Number((10 + pad).toFixed(6)),
    ];
    expect(
      ring.some((p) => p[0] === minCorner[0] && p[1] === minCorner[1]),
    ).toBe(true);
    expect(
      ring.some((p) => p[0] === maxCorner[0] && p[1] === maxCorner[1]),
    ).toBe(true);
  });

  it('a cluster whose points are all collinear yields a padded rectangle enclosing all of them', () => {
    const collection: FeatureCollection<Geometry> = {
      type: 'FeatureCollection',
      features: [
        point([0, 0], { clusterId: 'line' }),
        point([1, 1], { clusterId: 'line' }),
        point([2, 2], { clusterId: 'line' }),
      ],
    };

    const result = computeClusterHulls(collection);

    expect(result.features.length).toBe(1);
    const ring = roundRing(
      result.features[0].geometry.coordinates[0] as Position[],
    );
    const pad = HULL_DEGENERATE_PADDING_DEGREES;
    const minX = Number((0 - pad).toFixed(6));
    const maxX = Number((2 + pad).toFixed(6));
    const minY = Number((0 - pad).toFixed(6));
    const maxY = Number((2 + pad).toFixed(6));
    expect(ring).toEqual([
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
      [minX, minY],
    ]);
  });

  it('features with clusterId null/undefined contribute nothing; a collection of only unclustered features returns an empty features array', () => {
    const collection: FeatureCollection<Geometry> = {
      type: 'FeatureCollection',
      features: [
        point([0, 0], { clusterId: null }),
        point([1, 1], {}),
        point([2, 2], { clusterId: undefined }),
      ],
    };

    const result = computeClusterHulls(collection);

    expect(result.features).toEqual([]);
  });

  it('Polygon features contribute every vertex of their outer ring', () => {
    const ring: Position[] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];

    const positions = geometryToPositions({
      type: 'Polygon',
      coordinates: [ring],
    });

    expect(positions).toEqual(ring);
  });

  it('duplicate coordinates are de-duplicated before the >=3-point test', () => {
    const ring = convexHull([
      [0, 0],
      [0, 0],
      [1, 1],
      [1, 1],
    ]);

    expect(ring).toEqual([]);
  });

  it('two different clusters yield two polygons, each tagged with its own clusterId', () => {
    const collection: FeatureCollection<Geometry> = {
      type: 'FeatureCollection',
      features: [
        point([0, 0], { clusterId: 'a' }),
        point([10, 0], { clusterId: 'a' }),
        point([10, 10], { clusterId: 'a' }),
        point([0, 10], { clusterId: 'a' }),
        point([100, 100], { clusterId: 'b' }),
        point([110, 100], { clusterId: 'b' }),
        point([110, 110], { clusterId: 'b' }),
        point([100, 110], { clusterId: 'b' }),
      ],
    };

    const result = computeClusterHulls(collection);

    expect(result.features.length).toBe(2);
    const clusterIds = result.features
      .map((f) => f.properties.clusterId)
      .sort();
    expect(clusterIds).toEqual(['a', 'b']);
  });

  it('an empty input collection returns {type: "FeatureCollection", features: []}', () => {
    const result = computeClusterHulls({
      type: 'FeatureCollection',
      features: [],
    });

    expect(result).toEqual({ type: 'FeatureCollection', features: [] });
  });
});
