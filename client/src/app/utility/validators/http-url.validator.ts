import {AbstractControl, ValidatorFn} from '@angular/forms';

/**
 * Validator for checking if a string is a valid HTTP URL.
 *
 * @return Validator function for HTTP URLs.
 */
export const httpUrlValidator =
  (): ValidatorFn =>
  (control: AbstractControl): { [key: string]: any } => {
    if (!control.value) {
      return null;
    }
    try {
      const newUrl = new URL(control.value);
      return (newUrl.protocol === 'http:' || newUrl.protocol === 'https:') &&
        newUrl.hostname.includes('.')
        ? null
        : { invalidHttpUrl: true };
    } catch (err) {
      return { invalidHttpUrl: true };
    }
  };
