import {Component, HostBinding, OnInit, ViewChild, ViewEncapsulation,} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {AppState} from '../../../ngrx/reducers';
import {AuthCrudService} from '../../../services/crud/auth-crud.service';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {passwordsValidator} from '../../../utility/validators/passwords.validator';
import {FormDirective} from '../../shared/forms/form.directive';
import {Router} from '@angular/router';
import {Title} from '@angular/platform-browser';
import {marker} from '@jsverse/transloco-keys-manager/marker';
import {TranslocoService} from '@jsverse/transloco';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';

/**
 * A component that shows a form for changing the user's password.
 */
@Component({
  selector: 'lc-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ChangePasswordComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective) formDirective: FormDirective;

  public changePasswordForm: FormGroup;
  public loading = false;
  public changePasswordPressed = false;

  constructor(
    private authCrudService: AuthCrudService,
    private title: Title,
    private translocoService: TranslocoService,
    private store: Store<AppState>,
    private router: Router,
    private fb: FormBuilder,
  ) {}

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('changePasswordBrowserTitle'))} - ${instanceName}`,
      );
    });
    this.buildForm();
  }

  /**
   * Changes the password.
   */
  public changePassword() {
    this.changePasswordPressed = true;
    if (this.changePasswordForm.valid) {
      this.loading = true;
      this.authCrudService
        .changePassword(
          this.changePasswordForm.get('oldPassword').value,
          this.changePasswordForm.get('newPasswords.password').value,
        )
        .subscribe(
          () => {
            this.loading = false;
            this.store.dispatch(
              toastNotification(NotificationIdentifier.CHANGE_PASSWORD_SUCCESS),
            );
            this.router.navigate(['']);
          },
          () => {
            this.loading = false;
          },
        );
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
    if (
      this.changePasswordForm.get('newPasswords.password').pristine ||
      this.changePasswordForm.get('newPasswords.passwordConfirm').pristine
    ) {
      return false;
    }
    return (
      this.changePasswordForm.get('newPasswords').errors &&
      this.changePasswordForm.get('newPasswords').errors['passwordsMatch']
    );
  }

  /**
   * Builds the password change form.
   */
  private buildForm() {
    this.changePasswordForm = this.fb.group({
      newPasswords: this.fb.group(
        {
          password: ['', [Validators.required, Validators.minLength(8)]],
          passwordConfirm: ['', [Validators.required, Validators.minLength(8)]],
        },
        {
          validators: passwordsValidator(),
        },
      ),
      oldPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }
}
