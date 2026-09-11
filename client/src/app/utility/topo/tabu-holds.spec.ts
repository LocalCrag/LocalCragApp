import {
  cloneTabuAreaIds,
  cloneTabuAreas,
  cloneTabuHolds,
  createTabuArea,
  isCompleteTabuPolygon,
  resolveTabuPolygons,
  subtractTabuAreas,
  tabuAreaIdsEqual,
  tabuAreasEqual,
  tabuPolygonEqual,
  tabuPolygonHasKinks,
} from './tabu-holds';

describe('tabu hold helpers', () => {
  it('requires at least three vertices', () => {
    expect(isCompleteTabuPolygon([1, 2, 3, 4])).toBeFalse();
    expect(isCompleteTabuPolygon([1, 2, 3, 4, 5, 6])).toBeTrue();
  });

  it('rejects odd-length polygons', () => {
    expect(isCompleteTabuPolygon([1, 2, 3, 4, 5, 6, 7])).toBeFalse();
  });

  it('clones nested polygon arrays', () => {
    const original = [[10, 20, 30, 20, 30, 40]];
    const cloned = cloneTabuHolds(original);
    cloned[0][0] = 99;
    expect(original[0][0]).toBe(10);
  });

  it('compares tabu polygons by value', () => {
    expect(tabuPolygonEqual([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6])).toBeTrue();
    expect(tabuPolygonEqual([1, 2, 3, 4, 5, 6], [])).toBeFalse();
  });

  it('detects self-intersecting tabu polygons', () => {
    expect(tabuPolygonHasKinks([0, 0, 10, 0, 5, 8])).toBeFalse();
    expect(tabuPolygonHasKinks([0, 0, 10, 10, 10, 0, 0, 10])).toBeTrue();
    expect(tabuPolygonHasKinks([0, 0, 10, 0, 10, 10, 0, 10])).toBeFalse();
  });

  it('creates tabu areas with cloned paths', () => {
    const path = [1, 2, 3, 4, 5, 6];
    const area = createTabuArea(path, 'area-1');
    area.path[0] = 99;
    expect(path[0]).toBe(1);
    expect(area.id).toBe('area-1');
  });

  it('clones tabu area catalogs without sharing path arrays', () => {
    const original = [{ id: 'a', path: [1, 2, 3, 4, 5, 6] }];
    const cloned = cloneTabuAreas(original);
    cloned[0].path[0] = 99;
    expect(original[0].path[0]).toBe(1);
  });

  it('compares tabu area catalogs and id lists', () => {
    expect(
      tabuAreasEqual(
        [{ id: 'a', path: [1, 2, 3, 4, 5, 6] }],
        [{ id: 'a', path: [1, 2, 3, 4, 5, 6] }],
      ),
    ).toBeTrue();
    expect(
      tabuAreasEqual(
        [{ id: 'a', path: [1, 2, 3, 4, 5, 6] }],
        [{ id: 'b', path: [1, 2, 3, 4, 5, 6] }],
      ),
    ).toBeFalse();
    expect(tabuAreaIdsEqual(['a', 'b'], ['a', 'b'])).toBeTrue();
    expect(tabuAreaIdsEqual(['a'], [])).toBeFalse();
  });

  it('resolves selected tabu polygons from the image catalog', () => {
    expect(
      resolveTabuPolygons(
        ['b', 'missing', 'a'],
        [
          { id: 'a', path: [1, 2, 3, 4, 5, 6] },
          { id: 'b', path: [9, 8, 7, 6, 5, 4] },
        ],
      ),
    ).toEqual([
      [9, 8, 7, 6, 5, 4],
      [1, 2, 3, 4, 5, 6],
    ]);
  });

  it('subtracts assigned tabu areas from a catalog by id', () => {
    expect(
      subtractTabuAreas(
        [
          { id: 'a', path: [1, 2, 3, 4, 5, 6] },
          { id: 'b', path: [9, 8, 7, 6, 5, 4] },
        ],
        ['a'],
      ),
    ).toEqual([{ id: 'b', path: [9, 8, 7, 6, 5, 4] }]);
  });

  it('clones tabu area ids', () => {
    const original = ['a', 'b'];
    const cloned = cloneTabuAreaIds(original);
    cloned.push('c');
    expect(original).toEqual(['a', 'b']);
  });
});
