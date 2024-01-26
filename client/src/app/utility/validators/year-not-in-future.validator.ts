import {AbstractControl, ValidatorFn} from '@angular/forms';

/**
 * Validator for checking if a year of a Date is not in the future.
 *
 * @return Validator function for years.
 */
export const yearOfDateNotInFutureValidator = (): ValidatorFn => (control: AbstractControl): { [key: string]: any } => {
  if(!control.value){
    return null;
  }
  const year = control.value.getFullYear();
  if(year > (new Date().getFullYear())){
    return {dateInFuture: true}
  }
  return null;
};
