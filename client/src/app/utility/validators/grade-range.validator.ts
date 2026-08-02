import { AbstractControl, ValidatorFn } from '@angular/forms';

/**
 * Ensures gradeValueMax is not below gradeValueMin on the same form group.
 * Attach to the gradeValueMax control.
 */
export const gradeRangeValidator =
  (): ValidatorFn =>
  (control: AbstractControl): { [key: string]: boolean } | null => {
    const group = control.parent;
    if (!group) {
      return null;
    }
    const min = group.get('gradeValueMin')?.value;
    const max = control.value;
    if (min == null || max == null) {
      return null;
    }
    return Number(max) < Number(min) ? { gradeRange: true } : null;
  };
