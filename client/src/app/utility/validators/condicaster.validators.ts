import { ValidatorFn } from '@angular/forms';

/** Empty is allowed. A value must be a positive integer crag id. */
export const condicasterCragIdValidator: ValidatorFn = (control) => {
  const value = control.value;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    return { condicasterCragId: true };
  }
  return null;
};
