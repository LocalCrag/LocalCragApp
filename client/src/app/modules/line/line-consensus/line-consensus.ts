/** Smallest filled bar, so a single vote stays visible next to a much larger one. */
const MIN_BAR_PERCENT = 8;

export interface GradeVoteBar {
  value: number;
  count: number;
  name: string;
  width: number;
  consensus: boolean;
}

export interface RatingRow {
  stars: number;
  count: number;
  width: number;
}

/**
 * Bars for grades climbers actually proposed. Ungraded ticks (value 0 and
 * below) are omitted. Widths are a percent of the busiest grade.
 */
export function buildGradeVoteBars(
  votes: Record<string, number> | null | undefined,
  names: Record<number, string>,
  consensusValue: number | null,
): GradeVoteBar[] {
  const entries = Object.entries(votes ?? {})
    .map(([value, count]) => ({
      value: Number(value),
      count: Number(count),
    }))
    .filter((entry) => entry.value > 0 && entry.count > 0)
    .sort((left, right) => left.value - right.value);
  const max = entries.reduce(
    (highest, entry) => Math.max(highest, entry.count),
    0,
  );
  return entries.map((entry) => ({
    value: entry.value,
    count: entry.count,
    name: names[entry.value] || String(entry.value),
    width: barWidth(entry.count, max),
    consensus: entry.value === consensusValue,
  }));
}

/** Five star rows, highest first, including ratings nobody chose. */
export function buildRatingRows(
  distribution: Record<string, number> | null | undefined,
): RatingRow[] {
  const rows = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: Number(distribution?.[String(stars)] ?? 0) || 0,
  }));
  const max = rows.reduce((highest, row) => Math.max(highest, row.count), 0);
  return rows.map((row) => ({
    ...row,
    width: barWidth(row.count, max),
  }));
}

function barWidth(count: number, max: number): number {
  if (count <= 0 || max <= 0) {
    return 0;
  }
  return Math.max(MIN_BAR_PERCENT, Math.round((count / max) * 100));
}
