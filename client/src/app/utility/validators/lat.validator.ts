import { AbstractControl, ValidatorFn } from '@angular/forms';

export function isValidLatitude(value: unknown): boolean {
  const parsedNumber = Number(value);
  if (Number.isNaN(parsedNumber) || !Number.isFinite(parsedNumber)) {
    return false;
  }
  return Math.abs(parsedNumber) <= 90;
}

/**
 * Validator for latitude.
 *
 * @return Validator function for latitude.
 */
export const latValidator =
  (): ValidatorFn =>
  (control: AbstractControl): { [key: string]: any } =>
    isValidLatitude(control.value) ? null : { invalidLat: true };
