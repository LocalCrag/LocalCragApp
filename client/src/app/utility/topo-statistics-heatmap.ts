/** ISO weeks shown as columns. Week 53 only occurs in some years. */
export const HEATMAP_WEEK_COUNT = 53;

/** Monday (1) through Sunday (7), matching PostgreSQL ISO day numbers. */
export const HEATMAP_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

export type HeatmapCell = {
  week: number;
  weekday: number;
  count: number;
  key: string;
};

export type HeatmapWeekdayRow = {
  weekday: number;
  cells: HeatmapCell[];
};

export function buildWeekHeatmap(
  counts: Record<string, number> | null | undefined,
): HeatmapWeekdayRow[] {
  const source = counts ?? {};
  return HEATMAP_WEEKDAYS.map((weekday) => {
    const cells: HeatmapCell[] = [];
    for (let week = 1; week <= HEATMAP_WEEK_COUNT; week++) {
      const key = `${String(week).padStart(2, '0')}-${weekday}`;
      cells.push({
        week,
        weekday,
        count: source[key] ?? 0,
        key,
      });
    }
    return { weekday, cells };
  });
}

export function heatmapMax(rows: HeatmapWeekdayRow[]): number {
  return rows.reduce(
    (max, row) => Math.max(max, ...row.cells.map((cell) => cell.count)),
    0,
  );
}
