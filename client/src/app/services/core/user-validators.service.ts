import {Injectable} from '@angular/core';
import {AbstractControl, AsyncValidatorFn, ValidationErrors,} from '@angular/forms';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {UsersService} from '../crud/users.service';

@Injectable({
  providedIn: 'root',
})
export class UserValidatorsService {
  constructor(private usersService: UsersService) {}

  /**
   * Validator that checks if an email is taken.
   *
   * @param exceptions List of emails that can be taken but won't trigger the validator.
   * Usually used for a users email when editing the user.
   * @return Async validator function for email uniqueness.
   */
  emailValidator(exceptions: string[] = []): AsyncValidatorFn {
    return (ctrl: AbstractControl): Observable<ValidationErrors> =>
      this.usersService.getEmailTaken(ctrl.value).pipe(
        map((emailTaken) => {
          if (exceptions.includes(ctrl.value)) {
            emailTaken = false;
          }
          if (!emailTaken) {
            return null;
          }
          return {
            emailTaken: true,
          };
        }),
      );
  }
}
