import { Grade } from '../../../models/scale';

export type RankingExample = {
  grade: string;
  points: number;
  nextGrade: string;
  nextPoints: number;
};

/**
 * Two grades that illustrate how ranking points follow the scale.
 * Prefers the grade worth 10 points and the next grade, which is the
 * Fontainebleau 6A / 6A+ pair on the default boulder scale.
 */
export function rankingExampleFromGrades(
  grades: Grade[],
): RankingExample | null {
  const positive = grades
    .filter((grade) => grade.value > 0 && !!grade.name)
    .slice()
    .sort((left, right) => left.value - right.value);
  if (positive.length < 2) {
    return null;
  }
  const tenIndex = positive.findIndex((grade) => grade.value === 10);
  const index =
    tenIndex >= 0 && tenIndex < positive.length - 1
      ? tenIndex
      : Math.max(0, Math.floor((positive.length - 2) / 2));
  const first = positive[index];
  const second = positive[index + 1];
  return {
    grade: first.name,
    points: first.value,
    nextGrade: second.name,
    nextPoints: second.value,
  };
}
