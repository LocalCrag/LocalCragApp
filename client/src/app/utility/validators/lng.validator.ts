import { AbstractControl, ValidatorFn } from '@angular/forms';

/**
 * Validator for longitude.
 *
 * @return Validator function for longitude.
 */
export const lngValidator =
  (): ValidatorFn =>
  (control: AbstractControl): { [key: string]: any } => {
    const parsedNumber = Number(control.value);
    if (
      Number.isNaN(parsedNumber) ||
      !isFinite(parsedNumber) ||
      Math.abs(parsedNumber) > 180
    ) {
      return { invalidLng: true };
    }
    return null;
  };
