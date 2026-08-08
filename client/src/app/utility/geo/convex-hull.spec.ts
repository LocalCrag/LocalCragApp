import {
  dedupePositions,
  geometryForPublishFromOverlays,
  geometryFromOverlayPoints,
  pointAtCentroid,
} from './convex-hull';

describe('convex-hull publish helpers', () => {
  it('dedupePositions collapses near-identical points', () => {
    const pts = dedupePositions([
      [8.1, 50.2],
      [8.1000001, 50.2000001],
      [8.2, 50.3],
    ]);
    expect(pts.length).toBe(2);
  });

  it('geometryFromOverlayPoints returns null for fewer than 3 points', () => {
    expect(
      geometryFromOverlayPoints([
        [8.1, 50.2],
        [8.2, 50.3],
      ]),
    ).toBeNull();
  });

  it('geometryFromOverlayPoints returns Polygon for 3+ points', () => {
    const g = geometryFromOverlayPoints([
      [8.1, 50.2],
      [8.2, 50.2],
      [8.15, 50.3],
    ]);
    expect(g?.type).toBe('Polygon');
  });

  it('pointAtCentroid returns null for empty', () => {
    expect(pointAtCentroid([])).toBeNull();
  });

  it('pointAtCentroid averages 1–2 points', () => {
    const one = pointAtCentroid([[8.0, 50.0]]);
    expect(one).toEqual({ type: 'Point', coordinates: [8.0, 50.0] });
    const two = pointAtCentroid([
      [8.0, 50.0],
      [10.0, 52.0],
    ]);
    expect(two).toEqual({ type: 'Point', coordinates: [9.0, 51.0] });
  });

  it('geometryForPublishFromOverlays: 0 → null, 1–2 → Point, 3+ → Polygon', () => {
    expect(geometryForPublishFromOverlays([])).toBeNull();
    expect(geometryForPublishFromOverlays([[1, 2]])?.type).toBe('Point');
    expect(
      geometryForPublishFromOverlays([
        [1, 2],
        [3, 4],
      ])?.type,
    ).toBe('Point');
    expect(
      geometryForPublishFromOverlays([
        [1, 2],
        [3, 2],
        [2, 4],
      ])?.type,
    ).toBe('Polygon');
  });
});
