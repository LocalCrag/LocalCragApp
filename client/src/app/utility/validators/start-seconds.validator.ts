import { AbstractControl, ValidatorFn } from '@angular/forms';

/** A video bookmark is a whole number of seconds within one day. */
export const startSecondsValidator =
  (): ValidatorFn =>
  (control: AbstractControl): { [key: string]: any } => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 86400) {
      return { startSeconds: true };
    }
    return null;
  };
