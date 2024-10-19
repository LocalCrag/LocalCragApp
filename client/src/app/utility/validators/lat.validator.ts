import {AbstractControl, ValidatorFn} from '@angular/forms';

/**
 * Validator for latitude.
 *
 * @return Validator function for latitude.
 */
export const latValidator =
  (): ValidatorFn =>
  (control: AbstractControl): { [key: string]: any } => {
    const parsedNumber = Number(control.value);
    if (
      Number.isNaN(parsedNumber) ||
      !isFinite(parsedNumber) ||
      Math.abs(parsedNumber) > 90
    ) {
      return { invalidLat: true };
    }
    return null;
  };
