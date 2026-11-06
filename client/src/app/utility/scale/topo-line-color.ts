import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { LineType } from '../../enums/line-type';
import { StackedChartBracket } from '../../models/scale';
import { InstanceSettingsState } from '../../ngrx/reducers/instance-settings.reducers';
import { selectInstanceSettingsState } from '../../ngrx/selectors/instance-settings.selectors';
import { ScalesService } from '../../services/crud/scales.service';
import { highlightColor, textColor } from '../misc/color';
import {
  getStackedChartBracketColor,
  getStackedChartBracketValue,
  STACKED_CHART_PROJECT_COLOR,
} from './stacked-chart-brackets';

export type TopoLineColorSource =
  | {
      color?: string | null;
      type?: LineType | null;
      gradeScale?: string | null;
      authorGradeValue?: number | null;
      userGradeValue?: number | null;
    }
  | null
  | undefined;

/**
 * Colors for one line on a topo image.
 * `highlight` follows a line or grade color when one is set, and the instance
 * highlight color otherwise. `editingHighlight` is always the instance color
 * so the path being drawn stays distinct from grade colors.
 */
export type TopoLinePaint = {
  /** Stroke and badge fill. Falls back to the arrow color when the line has none. */
  color: string;
  /**
   * Set only when the instance toggle maps this grade onto a stacked chart color.
   * Null keeps the line's own color, including an empty one.
   */
  scaleColor: string | null;
  highlight: string;
  text: string;
  highlightText: string;
  editingHighlight: string;
  arrowTextColor: string;
};

type PaintSettings = Pick<
  InstanceSettingsState,
  | 'arrowColor'
  | 'arrowTextColor'
  | 'arrowHighlightColor'
  | 'arrowHighlightTextColor'
  | 'colorLinesByScale'
  | 'displayUserGrades'
>;

/**
 * Same bucket rules as the stacked grade chart: non-positive grades are
 * outside the brackets, each earlier bracket takes grades up to its value,
 * and the last bracket takes everything above it.
 */
export function stackedChartColorForGradeValue(
  brackets: Array<StackedChartBracket | number> | null | undefined,
  gradeValue: number | null | undefined,
): string | null {
  if (!brackets?.length || typeof gradeValue !== 'number' || gradeValue <= 0) {
    return null;
  }
  for (let index = 0; index < brackets.length; index++) {
    const boundary = getStackedChartBracketValue(brackets[index]);
    if (index === brackets.length - 1 || gradeValue <= boundary) {
      return getStackedChartBracketColor(brackets[index], index);
    }
  }
  return null;
}

export function displayedGradeValue(
  line: TopoLineColorSource,
  displayUserGrades: boolean,
): number | null {
  if (!line) {
    return null;
  }
  const value = displayUserGrades ? line.userGradeValue : line.authorGradeValue;
  return typeof value === 'number' ? value : null;
}

export function topoLinePaintFrom(
  settings: PaintSettings,
  line: TopoLineColorSource,
  scaleColor: string | null,
  extraFallback?: string,
): TopoLinePaint {
  const arrowTextColor = settings.arrowTextColor;
  const editingHighlight = settings.arrowHighlightColor;
  if (scaleColor) {
    const highlight = highlightColor(scaleColor) ?? editingHighlight;
    return {
      color: scaleColor,
      scaleColor,
      highlight,
      text: textColor(scaleColor) ?? arrowTextColor,
      highlightText: textColor(highlight) ?? settings.arrowHighlightTextColor,
      editingHighlight,
      arrowTextColor,
    };
  }
  const highlight = highlightColor(line?.color) ?? settings.arrowHighlightColor;
  return {
    color: line?.color ?? extraFallback ?? settings.arrowColor,
    scaleColor: null,
    highlight,
    text: textColor(line?.color ?? extraFallback) ?? arrowTextColor,
    highlightText:
      textColor(highlightColor(line?.color)) ??
      settings.arrowHighlightTextColor,
    editingHighlight,
    arrowTextColor,
  };
}

/**
 * Resolves the topo color for a line. While the instance toggle is off, this
 * stays on the line color. While it is on, a positive grade uses the stacked
 * chart bracket color and a project uses the project chip color. Ungraded
 * lines keep their own color.
 */
export function topoLinePaint$(
  store: Store,
  scales: ScalesService,
  line: TopoLineColorSource,
  extraFallback?: string,
): Observable<TopoLinePaint> {
  return store.select(selectInstanceSettingsState).pipe(
    switchMap((settings) => {
      const plain = () =>
        topoLinePaintFrom(settings, line, null, extraFallback);
      if (!settings.colorLinesByScale || !line?.type || !line.gradeScale) {
        return of(plain());
      }
      const gradeValue = displayedGradeValue(line, settings.displayUserGrades);
      if (gradeValue != null && gradeValue < 0) {
        return of(
          topoLinePaintFrom(
            settings,
            line,
            STACKED_CHART_PROJECT_COLOR,
            extraFallback,
          ),
        );
      }
      if (gradeValue == null || gradeValue <= 0) {
        return of(plain());
      }
      return scales.getScale(line.type, line.gradeScale).pipe(
        map((scale) =>
          topoLinePaintFrom(
            settings,
            line,
            stackedChartColorForGradeValue(
              scale.gradeBrackets?.stackedChartBrackets,
              gradeValue,
            ),
            extraFallback,
          ),
        ),
        catchError(() => of(plain())),
      );
    }),
  );
}
