import {AbstractControl, ValidatorFn} from '@angular/forms';

/**
 * Validator for passwords. Fails if password and passwordMath don't match.
 *
 * @return Validator function for passwords.
 */
export const passwordsValidator =
  (): ValidatorFn =>
  (group: AbstractControl): { [key: string]: any } => {
    if (!group.get('password') || !group.get('passwordConfirm')) {
      return null;
    }
    const pw1 = group.get('password').value;
    const pw2 = group.get('passwordConfirm').value;
    return pw1 === pw2 ? null : { passwordsMatch: true };
  };
