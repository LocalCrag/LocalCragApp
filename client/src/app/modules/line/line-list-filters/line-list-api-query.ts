import { SelectItem } from 'primeng/api';
import { LineType } from '../../../enums/line-type';
import { LineListAdvancedFilters } from './line-list-filter.logic';

/**
 * Appends line list filter query params for GET /lines
 * (must stay aligned with server util/line_list_query_args.py).
 */
export function appendLineListQueryParams(
  params: URLSearchParams,
  advanced: LineListAdvancedFilters,
  scaleKey:
    | SelectItem<{ lineType: LineType; gradeScale: string } | undefined>
    | undefined,
  gradeFilterRange: (number | null)[],
): void {
  // Send whenever a scale is selected (including full-range slider); server applies the range as given.
  const max = gradeFilterRange[1];
  if (scaleKey?.value && typeof max === 'number') {
    params.set('line_type', scaleKey.value.lineType);
    params.set('grade_scale', scaleKey.value.gradeScale);
    params.set('min_grade', String(gradeFilterRange[0] ?? -2));
    params.set('max_grade', String(max));
  }
  if (advanced.requiredBoolKeys.length > 0) {
    params.set('required_bools', [...advanced.requiredBoolKeys].join(','));
  }
  if (advanced.minRating > 0 || advanced.maxRating < 5) {
    params.set('min_rating', String(advanced.minRating));
    params.set('max_rating', String(advanced.maxRating));
  }
  if (advanced.startingPosition != null) {
    params.set('starting_position', advanced.startingPosition);
  }
  if (advanced.hasVideo !== 'any') {
    params.set('has_video', advanced.hasVideo);
  }
  if (advanced.faYearFrom != null) {
    params.set('fa_year_from', String(advanced.faYearFrom));
  }
  if (advanced.faYearTo != null) {
    params.set('fa_year_to', String(advanced.faYearTo));
  }
  if (advanced.climbState !== 'any') {
    params.set(
      'climb_filter',
      advanced.climbState === 'climbed' ? 'climbed' : 'not_climbed',
    );
  }
}
