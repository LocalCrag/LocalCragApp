import { geometryAreaSqM } from './polygon-area';

describe('geometryAreaSqM', () => {
  it('returns null for points', () => {
    expect(
      geometryAreaSqM({
        type: 'Point',
        coordinates: [8.1, 50.2],
      }),
    ).toBeNull();
  });

  it('computes a positive area for a simple polygon', () => {
    const area = geometryAreaSqM({
      type: 'Polygon',
      coordinates: [
        [
          [8.0, 50.0],
          [8.1, 50.0],
          [8.1, 50.1],
          [8.0, 50.1],
          [8.0, 50.0],
        ],
      ],
    });
    expect(area).not.toBeNull();
    expect(area!).toBeGreaterThan(50_000_000);
    expect(area!).toBeLessThan(90_000_000);
  });

  it('returns null for multi-polygons (not used in rock explorer)', () => {
    expect(
      geometryAreaSqM({
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [8.0, 50.0],
              [8.05, 50.0],
              [8.05, 50.05],
              [8.0, 50.05],
              [8.0, 50.0],
            ],
          ],
        ],
      }),
    ).toBeNull();
  });
});
