import { Grade } from '../../models/scale';

/**
 * Filters scale grades for line create/edit selects.
 * When noClosedProjects is enabled, CLOSED_PROJECT (-2) is omitted so new
 * project lines are stored as OPEN_PROJECT (-1). An existing closed-project
 * grade on the line being edited is kept so the control can retain its value.
 */
export function filterSelectableGrades(
  grades: Grade[],
  options: {
    noClosedProjects: boolean;
    hideProjects?: boolean;
    keepGradeValue?: number | null;
  },
): Grade[] {
  let result = grades;
  if (options.hideProjects) {
    result = result.filter((grade) => grade.value >= 0);
  }
  if (options.noClosedProjects) {
    result = result.filter(
      (grade) => grade.value !== -2 || grade.value === options.keepGradeValue,
    );
  }
  return result;
}
