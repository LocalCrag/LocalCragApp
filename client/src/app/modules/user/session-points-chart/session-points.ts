export type SessionRange = '3m' | '1y' | '5y' | 'all';

export type SessionMetric = 'points' | 'count';

export type SessionGroup = {
  date: string;
  lineType: string;
  gradeScale: string;
  grades: number[];
};

export type SessionScale = {
  lineType: string;
  gradeScale: string;
};

export type SessionBar = {
  date: string;
  points: number;
  count: number;
  grades: number[];
};

export type GradeCount = {
  gradeValue: number;
  count: number;
};

export function sessionScaleKey(lineType: string, gradeScale: string): string {
  return `${lineType}\u0000${gradeScale}`;
}

export function listSessionScales(groups: SessionGroup[]): SessionScale[] {
  const seen = new Map<string, SessionScale>();
  for (const group of groups) {
    const key = sessionScaleKey(group.lineType, group.gradeScale);
    if (!seen.has(key)) {
      seen.set(key, { lineType: group.lineType, gradeScale: group.gradeScale });
    }
  }
  return [...seen.values()].sort((left, right) =>
    sessionScaleKey(left.lineType, left.gradeScale).localeCompare(
      sessionScaleKey(right.lineType, right.gradeScale),
    ),
  );
}

/** Scale with the most climbed lines. Ties break on line type, then scale name. */
export function defaultSessionScale(
  groups: SessionGroup[],
): SessionScale | null {
  const totals = new Map<string, { scale: SessionScale; count: number }>();
  for (const group of groups) {
    const key = sessionScaleKey(group.lineType, group.gradeScale);
    const current = totals.get(key);
    if (current) {
      current.count += group.grades.length;
    } else {
      totals.set(key, {
        scale: { lineType: group.lineType, gradeScale: group.gradeScale },
        count: group.grades.length,
      });
    }
  }
  const ranked = [...totals.values()].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return sessionScaleKey(
      left.scale.lineType,
      left.scale.gradeScale,
    ).localeCompare(
      sessionScaleKey(right.scale.lineType, right.scale.gradeScale),
    );
  });
  return ranked[0]?.scale ?? null;
}

export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function rangeStartIso(
  range: Exclude<SessionRange, 'all'>,
  today: Date,
): string {
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  if (range === '3m') {
    start.setMonth(start.getMonth() - 3);
  } else if (range === '1y') {
    start.setFullYear(start.getFullYear() - 1);
  } else {
    start.setFullYear(start.getFullYear() - 5);
  }
  return toIsoDate(start);
}

/**
 * Presets that actually drop older sessions, plus "all".
 * An empty list means every preset would show the same history as "all".
 */
export function filledSessionRanges(
  dates: string[],
  today: Date,
): SessionRange[] {
  if (dates.length === 0) {
    return [];
  }
  const oldest = [...dates].sort()[0];
  const presets: Exclude<SessionRange, 'all'>[] = ['3m', '1y', '5y'];
  const filled = presets.filter(
    (range) => oldest < rangeStartIso(range, today),
  );
  if (filled.length === 0) {
    return [];
  }
  return [...filled, 'all'];
}

export function sessionBarValue(
  bar: SessionBar,
  metric: SessionMetric,
): number {
  return metric === 'points' ? bar.points : bar.count;
}

export function sessionBars(
  groups: SessionGroup[],
  scale: SessionScale,
  range: SessionRange,
  today: Date,
): SessionBar[] {
  const key = sessionScaleKey(scale.lineType, scale.gradeScale);
  const cutoff = range === 'all' ? null : rangeStartIso(range, today);
  const byDate = new Map<string, number[]>();
  for (const group of groups) {
    if (sessionScaleKey(group.lineType, group.gradeScale) !== key) {
      continue;
    }
    if (cutoff && group.date < cutoff) {
      continue;
    }
    const grades = byDate.get(group.date) ?? [];
    grades.push(...group.grades);
    byDate.set(group.date, grades);
  }

  const bars: SessionBar[] = [];
  for (const date of [...byDate.keys()].sort()) {
    const grades = (byDate.get(date) ?? [])
      .filter((grade) => grade > 0)
      .sort((left, right) => right - left);
    const points = grades.reduce((sum, grade) => sum + grade, 0);
    if (grades.length > 0) {
      bars.push({ date, points, count: grades.length, grades });
    }
  }
  return bars;
}

export function gradeCounts(grades: number[]): GradeCount[] {
  const counts = new Map<number, number>();
  for (const grade of grades) {
    counts.set(grade, (counts.get(grade) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[0] - left[0])
    .map(([gradeValue, count]) => ({ gradeValue, count }));
}

export function formatSessionDate(iso: string, includeYear: boolean): string {
  const [year, month, day] = iso.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    return iso;
  }
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: '2-digit' } : {}),
  });
}
