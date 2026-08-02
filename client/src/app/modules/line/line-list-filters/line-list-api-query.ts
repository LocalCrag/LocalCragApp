import { SelectItem } from 'primeng/api';
import { LineType } from '../../../enums/line-type';
import { ApiQueryParams } from '../../../utility/http/query-params';
import { LineListAdvancedFilters } from './line-list-filter.logic';

/**
 * Appends line list filter query params for GET /lines
 * (must stay aligned with server util/line_list_query_args.py).
 */
export function appendLineListQueryParams(
  params: ApiQueryParams,
  advanced: LineListAdvancedFilters,
  scaleKey:
    | SelectItem<{ lineType: LineType; gradeScale: string } | undefined>
    | undefined,
  gradeFilterRange: (number | null)[],
): void {
  // Send whenever a scale is selected (including full-range slider); server applies the range as given.
  const max = gradeFilterRange[1];
  if (scaleKey?.value && typeof max === 'number') {
    params.line_type = scaleKey.value.lineType;
    params.grade_scale = scaleKey.value.gradeScale;
    params.min_grade = gradeFilterRange[0] ?? -2;
    params.max_grade = max;
  }
  if (advanced.requiredBoolKeys.length > 0) {
    params.required_bools = [...advanced.requiredBoolKeys].join(',');
  }
  if (advanced.minRating > 0 || advanced.maxRating < 5) {
    params.min_rating = advanced.minRating;
    params.max_rating = advanced.maxRating;
  }
  if (advanced.startingPosition != null) {
    params.starting_position = advanced.startingPosition;
  }
  if (advanced.drying != null) {
    params.drying = advanced.drying;
  }
  if (advanced.hasVideo !== 'any') {
    params.has_video = advanced.hasVideo;
  }
  if (advanced.faYearFrom != null) {
    params.fa_year_from = advanced.faYearFrom;
  }
  if (advanced.faYearTo != null) {
    params.fa_year_to = advanced.faYearTo;
  }
  if (advanced.climbState !== 'any') {
    params.climb_filter =
      advanced.climbState === 'climbed' ? 'climbed' : 'not_climbed';
  }
}
