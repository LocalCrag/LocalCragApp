import { AbstractControl, ValidatorFn } from '@angular/forms';

export function isValidLongitude(value: unknown): boolean {
  const parsedNumber = Number(value);
  if (Number.isNaN(parsedNumber) || !Number.isFinite(parsedNumber)) {
    return false;
  }
  return Math.abs(parsedNumber) <= 180;
}

/**
 * Validator for longitude.
 *
 * @return Validator function for longitude.
 */
export const lngValidator =
  (): ValidatorFn =>
  (control: AbstractControl): { [key: string]: any } =>
    isValidLongitude(control.value) ? null : { invalidLng: true };
