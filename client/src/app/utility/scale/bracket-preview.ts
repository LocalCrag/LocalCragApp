import { DEFAULT_STACKED_CHART_BRACKET_COLORS } from './stacked-chart-brackets';

export type PreviewGrade = {
  name?: string | null;
  value?: number | null;
};

export type PreviewStackedBracket = {
  value?: number | null;
  color?: string | null;
};

export type PreviewBarBracket = {
  value?: number | null;
  name?: string | null;
};

export type StackedPreviewSegment = {
  color: string;
  count: number;
  label: string;
};

export type StackedBracketPreview = {
  segments: StackedPreviewSegment[];
  gradedCount: number;
  projectCount: number;
  ungradedCount: number;
};

export type BarPreviewBucket = {
  label: string;
  count: number;
};

export type BarBracketPreview = {
  buckets: BarPreviewBucket[];
  gradedCount: number;
  projectCount: number;
  ungradedCount: number;
};

export type StackedPreviewWords = {
  until: string;
  from: string;
};

/**
 * Same rules as the scale form: at least two unique values above 0, and the
 * last two values in form order are consecutive.
 */
function bracketValues(brackets: { value?: number | null }[]): number[] | null {
  if (!brackets || brackets.length < 2) {
    return null;
  }
  const values: number[] = [];
  for (const bracket of brackets) {
    const value = bracket?.value;
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return null;
    }
    values.push(value);
  }
  if (new Set(values).size !== values.length) {
    return null;
  }
  if (values[values.length - 2] + 1 !== values[values.length - 1]) {
    return null;
  }
  return values;
}

function finiteGrades(
  grades: PreviewGrade[],
): { name: string; value: number }[] {
  return (grades ?? [])
    .filter(
      (grade) =>
        typeof grade?.value === 'number' && Number.isFinite(grade.value),
    )
    .map((grade) => ({
      name: (grade.name ?? '').trim(),
      value: grade.value as number,
    }));
}

function displayGradeName(
  names: Record<number, string>,
  value: number,
): string {
  return names[value] || String(value);
}

/**
 * Buckets grades the same way as the stacked meter on crag and sector lists.
 * Each grade counts as one, so interval width shows how many grades it covers.
 * Returns null while the intervals would also fail form validation.
 */
export function buildStackedBracketPreview(
  grades: PreviewGrade[],
  brackets: PreviewStackedBracket[],
  words: StackedPreviewWords,
): StackedBracketPreview | null {
  if (!bracketValues(brackets)) {
    return null;
  }

  const sortedGrades = finiteGrades(grades).sort((a, b) => a.value - b.value);
  const gradeNameByValue: Record<number, string> = {};
  const nextGradeName: Record<number, string> = {};
  sortedGrades.forEach((grade, index, all) => {
    gradeNameByValue[grade.value] = grade.name;
    nextGradeName[grade.value] =
      index === all.length - 1 ? '' : all[index + 1].name;
  });

  const segments: StackedPreviewSegment[] = brackets.map((bracket, index) => {
    const value = bracket.value as number;
    let label: string;
    if (index === 0) {
      label = `${words.until} ${displayGradeName(gradeNameByValue, value)}`;
    } else if (index === brackets.length - 1) {
      label = `${words.from} ${displayGradeName(gradeNameByValue, value)}`;
    } else {
      const previous = brackets[index - 1].value as number;
      const start =
        nextGradeName[previous] ||
        displayGradeName(gradeNameByValue, previous + 1);
      const end = displayGradeName(gradeNameByValue, value);
      label = !start || start === end ? end : `${start} - ${end}`;
    }
    const color = typeof bracket.color === 'string' ? bracket.color.trim() : '';
    return {
      color:
        color ||
        DEFAULT_STACKED_CHART_BRACKET_COLORS[
          index % DEFAULT_STACKED_CHART_BRACKET_COLORS.length
        ],
      count: 0,
      label,
    };
  });

  let projectCount = 0;
  let ungradedCount = 0;
  for (const grade of sortedGrades) {
    if (grade.value === 0) {
      ungradedCount += 1;
      continue;
    }
    if (grade.value < 0) {
      projectCount += 1;
      continue;
    }
    for (let index = 0; index < brackets.length; index++) {
      const boundary = brackets[index].value as number;
      if (index === brackets.length - 1 || grade.value <= boundary) {
        segments[index].count += 1;
        break;
      }
    }
  }

  return {
    segments,
    gradedCount: segments.reduce((sum, segment) => sum + segment.count, 0),
    projectCount,
    ungradedCount,
  };
}

/**
 * Buckets grades the same way as the condensed bar chart (narrow screens):
 * the last interval in form order is extended to the highest grade, then
 * intervals are sorted and each grade lands in the first interval that
 * reaches it.
 */
export function buildBarBracketPreview(
  grades: PreviewGrade[],
  brackets: PreviewBarBracket[],
): BarBracketPreview | null {
  if (!bracketValues(brackets)) {
    return null;
  }

  const parsedGrades = finiteGrades(grades);
  const maxGrade = parsedGrades.reduce(
    (max, grade) => Math.max(max, grade.value),
    brackets[brackets.length - 1].value as number,
  );
  const used = brackets.map((bracket) => ({
    label:
      (typeof bracket.name === 'string' ? bracket.name.trim() : '') ||
      String(bracket.value),
    value: bracket.value as number,
  }));
  used[used.length - 1] = {
    ...used[used.length - 1],
    value: Math.max(used[used.length - 1].value, maxGrade),
  };
  const scale = [...used]
    .sort((a, b) => a.value - b.value)
    .filter((bucket) => bucket.value > 0);
  const counts = scale.map(() => 0);
  let projectCount = 0;
  let ungradedCount = 0;

  for (const grade of parsedGrades) {
    if (grade.value === 0) {
      ungradedCount += 1;
      continue;
    }
    if (grade.value < 0) {
      projectCount += 1;
      continue;
    }
    const index = scale.findIndex((bucket) => bucket.value >= grade.value);
    if (index >= 0) {
      counts[index] += 1;
    }
  }

  const buckets = scale.map((bucket, index) => ({
    label: bucket.label,
    count: counts[index],
  }));

  return {
    buckets,
    gradedCount: counts.reduce((sum, count) => sum + count, 0),
    projectCount,
    ungradedCount,
  };
}
