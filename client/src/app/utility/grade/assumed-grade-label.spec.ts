import { of } from 'rxjs';
import { Line } from '../../models/line';
import { ScalesService } from '../../services/crud/scales.service';
import {
  formatAssumedGradeRange,
  withAssumedGradeRange,
} from './assumed-grade-label';

describe('assumed grade label', () => {
  const names = { 10: '6A', 16: '7A' };
  const line = {
    type: 'BOULDER',
    gradeScale: 'FB',
    assumedGradeMin: 10,
    assumedGradeMax: 16,
  } as Line;

  it('formats a range, a single grade, and missing bounds', () => {
    expect(formatAssumedGradeRange(names, 10, 16)).toBe(' (~6A–7A)');
    expect(formatAssumedGradeRange(names, 16, 16)).toBe(' (~7A)');
    expect(formatAssumedGradeRange(names, null, 16)).toBe('');
    expect(formatAssumedGradeRange(names, 10, 99)).toBe('');
  });

  it('appends the interval only for a project grade', (done) => {
    const scales = {
      gradeNameByValueMap: () => of(names),
    } as unknown as ScalesService;

    withAssumedGradeRange(scales, line, -1, 'Project').subscribe((label) => {
      expect(label).toBe('Project (~6A–7A)');
      done();
    });
  });

  it('leaves a real grade unchanged', (done) => {
    const scales = {
      gradeNameByValueMap: jasmine.createSpy('gradeNameByValueMap'),
    } as unknown as ScalesService;

    withAssumedGradeRange(scales, line, 16, '7A').subscribe((label) => {
      expect(label).toBe('7A');
      expect(scales.gradeNameByValueMap).not.toHaveBeenCalled();
      done();
    });
  });
});
