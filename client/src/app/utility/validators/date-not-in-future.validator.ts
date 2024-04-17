import {AbstractControl, ValidatorFn} from '@angular/forms';

export const dateNotInFutureValidator = (): ValidatorFn => (control: AbstractControl): { [key: string]: any } => {
  if(!control.value){
    return null;
  }
  const date = control.value;
  if(date > (new Date())){
    return {dateInFuture: true}
  }
  return null;
};

