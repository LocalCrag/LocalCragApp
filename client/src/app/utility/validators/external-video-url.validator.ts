import { AbstractControl, ValidatorFn } from '@angular/forms';
import { providerForUrl } from '../video-source';
import { httpUrlValidator } from './http-url.validator';

/**
 * External line and ascent videos must be YouTube, Vimeo, or Instagram.
 * A legacy URL already stored on the line stays valid until it is edited.
 */
export const externalVideoUrlValidator =
  (legacyUrl: string | null = null): ValidatorFn =>
  (control: AbstractControl): { [key: string]: boolean } | null => {
    const value = typeof control.value === 'string' ? control.value.trim() : '';
    if (!value) {
      return null;
    }
    if (legacyUrl && value === legacyUrl) {
      return httpUrlValidator()(control);
    }
    return providerForUrl(value) ? null : { unsupportedVideoUrl: true };
  };
