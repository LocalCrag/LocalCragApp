import {Component, HostBinding, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable, Subscription} from 'rxjs';
import {LoadingState} from '../../enums/loading-state';
import {Store} from '@ngrx/store';
import {AppState} from '../../ngrx/reducers';
import {AppNotificationsService} from '../../services/core/app-notifications.service';
import {AuthCrudService} from '../../services/crud/auth-crud.service';
import {toastNotification} from '../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../utility/notifications/notification-identifier.enum';
import {passwordsValidator} from '../../utility/validators/passwords.validator';
import {FormDirective} from '../../shared/forms/form.directive';

/**
 * A component that shows a form for changing the user's password.
 */
@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {

  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective, {static: true}) formDirective: FormDirective;

  public changePasswordForm: FormGroup;
  public loadingState: LoadingState = LoadingState.DEFAULT; // todo integrate here and in login view
  public changePasswordPressed = false;


  constructor(private authCrudService: AuthCrudService,
              private store: Store<AppState>,
              private notifications: AppNotificationsService,
              private fb: FormBuilder) {
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
  }

  /**
   * Changes the password.
   */
  public changePassword() {
    this.changePasswordPressed = true;
    if (this.changePasswordForm.valid) {
      this.loadingState = LoadingState.LOADING;
      this.authCrudService.changePassword(
        this.changePasswordForm.get('oldPassword').value,
        this.changePasswordForm.get('newPasswords.password').value
      ).subscribe(() => {
        this.loadingState = LoadingState.DEFAULT;
        this.store.dispatch(toastNotification(NotificationIdentifier.CHANGE_PASSWORD_SUCCESS));
      }, () => {
        this.loadingState = LoadingState.DEFAULT;
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Check if the passwords don't match.
   *
   * @return Returns true if the passwords don't match.
   */
  public passwordsDontMatch(): boolean {
    if (this.changePasswordForm.get('newPasswords.password').pristine ||
      this.changePasswordForm.get('newPasswords.passwordConfirm').pristine) {
      return false;
    }
    return this.changePasswordForm.get('newPasswords').errors && this.changePasswordForm.get('newPasswords').errors['passwordsMatch'];
  }

  /**
   * Builds the password change form.
   */
  private buildForm() {
    this.changePasswordForm = this.fb.group({
      newPasswords: this.fb.group({
        password: ['', [Validators.required, Validators.minLength(8)]],
        passwordConfirm: ['', [Validators.required, Validators.minLength(8)]]
      }, {
        validators: passwordsValidator()
      }),
      oldPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

}
