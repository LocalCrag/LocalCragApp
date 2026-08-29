import { filterSelectableGrades } from './filter-selectable-grades';
import { Grade } from '../../models/scale';

describe('filterSelectableGrades', () => {
  const grades: Grade[] = [
    { name: 'CLOSED_PROJECT', value: -2 },
    { name: 'OPEN_PROJECT', value: -1 },
    { name: 'UNGRADED', value: 0 },
    { name: '6A', value: 10 },
  ];

  it('keeps closed project when setting is off', () => {
    expect(
      filterSelectableGrades(grades, { noClosedProjects: false }).map(
        (g) => g.value,
      ),
    ).toEqual([-2, -1, 0, 10]);
  });

  it('removes closed project when setting is on', () => {
    expect(
      filterSelectableGrades(grades, { noClosedProjects: true }).map(
        (g) => g.value,
      ),
    ).toEqual([-1, 0, 10]);
  });

  it('keeps current closed project grade when editing', () => {
    expect(
      filterSelectableGrades(grades, {
        noClosedProjects: true,
        keepGradeValue: -2,
      }).map((g) => g.value),
    ).toEqual([-2, -1, 0, 10]);
  });

  it('hides all projects when hideProjects is set', () => {
    expect(
      filterSelectableGrades(grades, {
        noClosedProjects: true,
        hideProjects: true,
      }).map((g) => g.value),
    ).toEqual([0, 10]);
  });
});
