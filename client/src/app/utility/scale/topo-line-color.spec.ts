import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Line } from '../../models/line';
import { FullScale } from '../../models/scale';
import { ScalesService } from '../../services/crud/scales.service';
import { TopoLineColorPipe } from '../../modules/shared/pipes/topo-line-color.pipe';
import {
  stackedChartColorForGradeValue,
  topoLinePaintFrom,
} from './topo-line-color';

const brackets = [
  { value: 9, color: '#eab308' },
  { value: 15, color: '#3b82f6' },
  { value: 21, color: '#ef4444' },
  { value: 22, color: '#22c55e' },
];

const settings = {
  arrowColor: '#FFE016',
  arrowTextColor: '#000000',
  arrowHighlightColor: '#FF0000',
  arrowHighlightTextColor: '#FFFFFF',
  colorLinesByScale: false,
  displayUserGrades: false,
};

describe('stackedChartColorForGradeValue', () => {
  it('uses the same intervals as the stacked chart', () => {
    expect(stackedChartColorForGradeValue(brackets, 9)).toBe('#eab308');
    expect(stackedChartColorForGradeValue(brackets, 10)).toBe('#3b82f6');
    expect(stackedChartColorForGradeValue(brackets, 21)).toBe('#ef4444');
    expect(stackedChartColorForGradeValue(brackets, 22)).toBe('#22c55e');
    expect(stackedChartColorForGradeValue(brackets, 29)).toBe('#22c55e');
  });

  it('leaves projects and ungraded lines uncolored', () => {
    expect(stackedChartColorForGradeValue(brackets, 0)).toBeNull();
    expect(stackedChartColorForGradeValue(brackets, -1)).toBeNull();
    expect(stackedChartColorForGradeValue(brackets, -2)).toBeNull();
    expect(stackedChartColorForGradeValue([], 10)).toBeNull();
    expect(stackedChartColorForGradeValue(brackets, null)).toBeNull();
  });
});

describe('topoLinePaintFrom', () => {
  const line = {
    color: '#112233',
    authorGradeValue: 10,
    userGradeValue: 22,
  };

  it('keeps the line color when no scale color is resolved', () => {
    const paint = topoLinePaintFrom(settings, line, null, '#abcdef');
    expect(paint.color).toBe('#112233');
    expect(paint.editingHighlight).toBe('#FF0000');
  });

  it('falls back to the canvas color, then the arrow color', () => {
    expect(
      topoLinePaintFrom(settings, { color: null }, null, '#abcdef').color,
    ).toBe('#abcdef');
    expect(topoLinePaintFrom(settings, undefined, null).color).toBe('#FFE016');
  });

  it('replaces the line color when a scale color is resolved', () => {
    const paint = topoLinePaintFrom(settings, line, '#3b82f6');
    expect(paint.color).toBe('#3b82f6');
    expect(paint.highlight).not.toBe('#FF0000');
    expect(paint.editingHighlight).toBe('#FF0000');
  });
});

describe('TopoLineColorPipe', () => {
  let getScale: jasmine.Spy;
  let settings$: BehaviorSubject<Record<string, unknown>>;
  let pipe: TopoLineColorPipe;

  const line = {
    color: '#112233',
    type: 'BOULDER',
    gradeScale: 'FB',
    authorGradeValue: 10,
    userGradeValue: 22,
  } as unknown as Line;

  const scale = {
    gradeBrackets: { stackedChartBrackets: brackets },
  } as unknown as FullScale;

  beforeEach(() => {
    getScale = jasmine.createSpy('getScale').and.returnValue(of(scale));
    settings$ = new BehaviorSubject<Record<string, unknown>>({
      ...settings,
    });
    TestBed.configureTestingModule({
      providers: [
        TopoLineColorPipe,
        { provide: ScalesService, useValue: { getScale } },
        { provide: Store, useValue: { select: () => settings$ } },
      ],
    });
    pipe = TestBed.inject(TopoLineColorPipe);
  });

  it('returns the line color while the instance toggle is off', () => {
    expect(pipe.transform(line)).toBe('#112233');
    expect(getScale).not.toHaveBeenCalled();
  });

  it('returns the stacked chart color for the author grade', () => {
    settings$.next({ ...settings, colorLinesByScale: true });
    expect(pipe.transform(line)).toBe('#3b82f6');
  });

  it('uses the user grade when that grade is the one shown', () => {
    settings$.next({
      ...settings,
      colorLinesByScale: true,
      displayUserGrades: true,
    });
    expect(pipe.transform(line)).toBe('#22c55e');
  });

  it('uses the project chip color for projects', () => {
    const project = {
      ...line,
      authorGradeValue: -1,
    } as unknown as Line;
    settings$.next({ ...settings, colorLinesByScale: true });
    expect(pipe.transform(project)).toBe('#e5e7eb');
    expect(getScale).not.toHaveBeenCalled();
  });

  it('keeps the line color when the scale cannot be loaded', () => {
    getScale.and.returnValue(throwError(() => new Error('missing')));
    settings$.next({ ...settings, colorLinesByScale: true });
    expect(pipe.transform(line)).toBe('#112233');
  });
});
