import { LineType } from '../../../enums/line-type';
import { StartingPosition } from '../../../enums/starting-position';
import { SelectItem } from 'primeng/api';

export type LineListVideoFilterMode = 'any' | 'yes' | 'no';
export type LineListClimbFilterMode = 'any' | 'climbed' | 'notClimbed';

/** Line boolean property keys accepted by GET /lines `required_bools` (see server `line_list_query_args.py`). */
export const LINE_LIST_BOOL_KEYS = [
  'eliminate',
  'traverse',
  'highball',
  'lowball',
  'morpho',
  'noTopout',
  'badDropzone',
  'childFriendly',
  'roof',
  'slab',
  'vertical',
  'overhang',
  'athletic',
  'technical',
  'endurance',
  'cruxy',
  'dyno',
  'jugs',
  'sloper',
  'crimps',
  'pockets',
  'pinches',
  'crack',
  'dihedral',
  'compression',
  'arete',
  'mantle',
] as const;

export type LineListBoolKey = (typeof LINE_LIST_BOOL_KEYS)[number];

export interface LineListAdvancedFilters {
  requiredBoolKeys: LineListBoolKey[];
  minRating: number;
  maxRating: number;
  /** `null` = do not filter by starting position. */
  startingPosition: StartingPosition | null;
  hasVideo: LineListVideoFilterMode;
  faYearFrom: number | null;
  faYearTo: number | null;
  climbState: LineListClimbFilterMode;
}

export interface LineListFiltersPersisted {
  advanced: LineListAdvancedFilters;
  grade: {
    scale: { lineType: LineType; gradeScale: string } | null;
    range: [number, number];
  };
}

/** Advanced filter state with every option unset (no narrowing). */
export function defaultLineListAdvancedFilters(): LineListAdvancedFilters {
  return {
    requiredBoolKeys: [],
    minRating: 0,
    maxRating: 5,
    startingPosition: null,
    hasVideo: 'any',
    faYearFrom: null,
    faYearTo: null,
    climbState: 'any',
  };
}

/**
 * Whether any advanced (dialog) filter narrows the line list.
 * Does not include header grade filters — those stay visible outside the modal.
 */
export function advancedLineListFiltersActive(
  f: LineListAdvancedFilters,
): boolean {
  if (f.requiredBoolKeys.length > 0) return true;
  if (f.minRating > 0 || f.maxRating < 5) return true;
  if (f.startingPosition != null) return true;
  if (f.hasVideo !== 'any') return true;
  if (f.faYearFrom != null || f.faYearTo != null) return true;
  if (f.climbState !== 'any') return true;
  return false;
}

/** Type guard for keys in {@link LINE_LIST_BOOL_KEYS}. */
function isLineListBoolKey(k: string): k is LineListBoolKey {
  return (LINE_LIST_BOOL_KEYS as readonly string[]).includes(k);
}

/**
 * Coerces partial or persisted advanced filter JSON into a safe {@link LineListAdvancedFilters}.
 * Invalid bool keys are dropped; ratings are clamped to 0–5 and min ≤ max.
 */
export function sanitizeLineListAdvancedFilters(
  raw: Partial<LineListAdvancedFilters> | null | undefined,
): LineListAdvancedFilters {
  const d = defaultLineListAdvancedFilters();
  if (!raw || typeof raw !== 'object') return d;
  const requiredBoolKeys = Array.isArray(raw.requiredBoolKeys)
    ? raw.requiredBoolKeys.filter(
        (k): k is LineListBoolKey =>
          typeof k === 'string' && isLineListBoolKey(k),
      )
    : [];
  const startingPosition = raw.startingPosition ?? null;
  const hasVideo =
    raw.hasVideo === 'yes' || raw.hasVideo === 'no' ? raw.hasVideo : 'any';
  const climbState =
    raw.climbState === 'climbed' || raw.climbState === 'notClimbed'
      ? raw.climbState
      : 'any';
  const minRating =
    typeof raw.minRating === 'number' &&
    raw.minRating >= 0 &&
    raw.minRating <= 5
      ? raw.minRating
      : d.minRating;
  const maxRating =
    typeof raw.maxRating === 'number' &&
    raw.maxRating >= 0 &&
    raw.maxRating <= 5
      ? raw.maxRating
      : d.maxRating;
  const faYearFrom =
    typeof raw.faYearFrom === 'number' && raw.faYearFrom > 0
      ? raw.faYearFrom
      : null;
  const faYearTo =
    typeof raw.faYearTo === 'number' && raw.faYearTo > 0 ? raw.faYearTo : null;
  return {
    requiredBoolKeys,
    minRating: Math.min(minRating, maxRating),
    maxRating: Math.max(minRating, maxRating),
    startingPosition,
    hasVideo,
    faYearFrom,
    faYearTo,
    climbState,
  };
}

export type LineListScaleSelectItem = SelectItem<
  { lineType: LineType; gradeScale: string } | undefined
>;

/**
 * `availableScales` is built with index 0 = "ALL" (`value: undefined`) and 1..n = concrete scales.
 * Use the only concrete scale when there is no multi-scale dropdown; otherwise default to "ALL".
 */
export function defaultLineListScaleKey(
  availableScales: LineListScaleSelectItem[],
): LineListScaleSelectItem | undefined {
  if (availableScales.length === 0) {
    return undefined;
  }
  if (availableScales.length <= 2) {
    return availableScales[1] ?? availableScales[0];
  }
  return availableScales[0];
}

/** Payload when the user confirms the line list filters dialog. */
export interface LineListFiltersDialogResult {
  advanced: LineListAdvancedFilters;
  scaleKey: LineListScaleSelectItem;
  gradeFilterRange: (number | null)[];
  maxGradeValue: number | null;
}
