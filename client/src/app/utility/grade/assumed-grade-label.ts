import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Line } from '../../models/line';
import { ScalesService } from '../../services/crud/scales.service';

/**
 * Parenthetical range for a project's assumed bounds, or an empty string.
 * A single grade is shown when both bounds match.
 */
export function formatAssumedGradeRange(
  names: Record<number, string>,
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min == null || max == null) {
    return '';
  }
  const lower = names[min];
  const upper = names[max];
  if (!lower || !upper) {
    return '';
  }
  return lower === upper ? ` (~${lower})` : ` (~${lower}–${upper})`;
}

/**
 * Appends the assumed interval when `gradeValue` is a project grade and both
 * bounds are set. Real grades are returned unchanged.
 */
export function withAssumedGradeRange(
  scales: ScalesService,
  line: Line,
  gradeValue: number | null | undefined,
  gradeLabel: string,
): Observable<string> {
  if (
    typeof gradeValue !== 'number' ||
    gradeValue >= 0 ||
    line.assumedGradeMin == null ||
    line.assumedGradeMax == null
  ) {
    return of(gradeLabel);
  }
  return scales
    .gradeNameByValueMap(line.type, line.gradeScale)
    .pipe(
      map(
        (names) =>
          gradeLabel +
          formatAssumedGradeRange(
            names,
            line.assumedGradeMin,
            line.assumedGradeMax,
          ),
      ),
    );
}
