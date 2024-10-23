import { AbstractControl, ValidatorFn } from '@angular/forms';

export const yearOfDateNotInFutureValidator =
  (): ValidatorFn =>
  (control: AbstractControl): { [key: string]: any } => {
    if (!control.value) {
      return null;
    }
    const year = control.value.getFullYear();
    if (year > new Date().getFullYear()) {
      return { dateInFuture: true };
    }
    return null;
  };
