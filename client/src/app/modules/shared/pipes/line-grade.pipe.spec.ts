import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { LineGradePipe } from './line-grade.pipe';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';
import { Line } from '../../../models/line';

describe('LineGradePipe', () => {
  // gradeNameByValue stub maps each value to a recognizable name, so the test
  // can assert which grade value (author vs user) the pipe resolved.
  let gradeNameByValue: jasmine.Spy;
  let settings$: BehaviorSubject<{ displayUserGrades: boolean }>;
  let pipe: LineGradePipe;

  // author grade 20, user grade 29 (distinct so the toggle/mode is observable)
  const line = {
    type: 'BOULDER',
    gradeScale: 'FB',
    authorGradeValue: 20,
    userGradeValue: 29,
  } as unknown as Line;

  beforeEach(() => {
    gradeNameByValue = jasmine
      .createSpy('gradeNameByValue')
      .and.callFake((_type, _scale, value) => of(`grade-${value}`));
    settings$ = new BehaviorSubject<{ displayUserGrades: boolean }>({
      displayUserGrades: false,
    });

    TestBed.configureTestingModule({
      providers: [
        LineGradePipe,
        { provide: ScalesService, useValue: { gradeNameByValue } },
        {
          provide: TranslateSpecialGradesService,
          useValue: { translate: (name: string) => name },
        },
        { provide: Store, useValue: { select: () => settings$ } },
      ],
    });

    pipe = TestBed.inject(LineGradePipe);
  });

  it('resolves the author grade when the toggle is off and no mode is given', () => {
    settings$.next({ displayUserGrades: false });
    expect(pipe.transform(line)).toBe('grade-20');
  });

  it('resolves the user grade when the toggle is on and no mode is given', () => {
    settings$.next({ displayUserGrades: true });
    expect(pipe.transform(line)).toBe('grade-29');
  });

  it('mode "author" forces the author grade regardless of the toggle', () => {
    settings$.next({ displayUserGrades: true });
    expect(pipe.transform(line, 'author')).toBe('grade-20');
  });

  it('mode "user" forces the user grade regardless of the toggle', () => {
    settings$.next({ displayUserGrades: false });
    expect(pipe.transform(line, 'user')).toBe('grade-29');
  });

  it('reacts to a toggle change without new arguments', () => {
    expect(pipe.transform(line)).toBe('grade-20');
    settings$.next({ displayUserGrades: true });
    expect(pipe.transform(line)).toBe('grade-29');
  });

  it('re-resolves only when the line or mode changes', () => {
    pipe.transform(line);
    pipe.transform(line);
    expect(gradeNameByValue).toHaveBeenCalledTimes(1);

    pipe.transform(line, 'user');
    expect(gradeNameByValue).toHaveBeenCalledTimes(2);
  });

  it('returns an empty string when no line is given', () => {
    expect(pipe.transform(undefined)).toBe('');
  });
});
