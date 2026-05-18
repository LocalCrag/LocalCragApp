import { LineType } from '../../../enums/line-type';
import {
  LineListFiltersPersisted,
  sanitizeLineListAdvancedFilters,
} from './line-list-filter.logic';

/**
 * localStorage key for the shared line list filter state.
 * `V1` is appended to the key so a future schema change can use
 * `lineListFiltersV2` without reading or mis-parsing data written by older clients.
 */
const STORAGE_KEY = 'lineListFiltersV1';

/**
 * Restores grade and advanced filters for all line list views from localStorage.
 * Returns `null` when storage is unavailable, missing, invalid, or from an unknown key version.
 */
export function loadLineListFilters(): LineListFiltersPersisted | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LineListFiltersPersisted;
    if (!parsed?.grade || !parsed.advanced) return null;
    const scale = parsed.grade.scale;
    if (
      scale != null &&
      (typeof scale.gradeScale !== 'string' ||
        typeof scale.lineType !== 'string')
    ) {
      return null;
    }
    const range = parsed.grade.range;
    if (
      !Array.isArray(range) ||
      range.length !== 2 ||
      typeof range[0] !== 'number' ||
      typeof range[1] !== 'number'
    ) {
      return null;
    }
    return {
      advanced: sanitizeLineListAdvancedFilters(parsed.advanced),
      grade: {
        scale: scale
          ? {
              lineType: scale.lineType as LineType,
              gradeScale: scale.gradeScale,
            }
          : null,
        range: [range[0], range[1]],
      },
    };
  } catch {
    return null;
  }
}

/** Persists grade and advanced filters in localStorage. */
export function saveLineListFilters(payload: LineListFiltersPersisted): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}
