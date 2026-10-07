import { buildWeekHeatmap, heatmapMax } from './topo-statistics-heatmap';

describe('buildWeekHeatmap', () => {
  it('places a count on its calendar week and weekday', () => {
    const rows = buildWeekHeatmap({ '29-1': 4, '29-7': 9 });

    expect(rows.length).toBe(7);
    expect(rows[0].weekday).toBe(1);
    expect(rows[0].cells.length).toBe(53);
    expect(rows[0].cells[28]).toEqual({
      week: 29,
      weekday: 1,
      count: 4,
      key: '29-1',
    });
    expect(rows[6].cells[28].count).toBe(9);
    expect(rows[0].cells[0].count).toBe(0);
  });

  it('reports the busiest cell', () => {
    const rows = buildWeekHeatmap({ '01-6': 2, '52-7': 11 });
    expect(heatmapMax(rows)).toBe(11);
    expect(heatmapMax(buildWeekHeatmap({}))).toBe(0);
  });
});
