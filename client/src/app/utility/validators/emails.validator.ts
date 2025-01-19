import { AbstractControl, ValidatorFn } from '@angular/forms';

/**
 * Validator for emails. Fails if email and emailConfirm don't match.
 *
 * @return Validator function for passwords.
 */
export const emailsValidator =
  (): ValidatorFn =>
  (group: AbstractControl): { [key: string]: any } => {
    if (!group.get('email') || !group.get('emailConfirm')) {
      return null;
    }
    const pw1 = group.get('email').value;
    const pw2 = group.get('emailConfirm').value;
    return pw1 === pw2 ? null : { emailsMatch: true };
  };
