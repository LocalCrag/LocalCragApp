import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const blocweatherUrlValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  // None is allowed
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    return { blocweatherUrl: { invalid: true } };
  }

  const url = value.trim();
  if (url === '') {
    return { blocweatherUrl: { invalid: true } };
  }

  const prefix = 'https://blocweather.com/';
  if (!url.startsWith(prefix)) {
    return { blocweatherUrl: { invalid: true } };
  }

  const remainder = url.substring(prefix.length);
  if (remainder.includes('?') || remainder.includes('#')) {
    return { blocweatherUrl: { invalid: true } };
  }

  const parts = remainder.split('/').filter((p) => p !== '');
  if (parts.length !== 3) {
    return { blocweatherUrl: { invalid: true } };
  }

  return null;
};
