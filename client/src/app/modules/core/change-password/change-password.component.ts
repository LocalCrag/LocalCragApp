import {
  Component,
  HostBinding,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppState } from '../../../ngrx/reducers';
import { AuthCrudService } from '../../../services/crud/auth-crud.service';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { passwordsValidator } from '../../../utility/validators/passwords.validator';
import { FormDirective } from '../../shared/forms/form.directive';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { Password } from 'primeng/password';
import { Message } from 'primeng/message';
import { NgIf } from '@angular/common';
import { Button } from 'primeng/button';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

/**
 * A component that shows a form for changing the user's password.
 */
@Component({
  selector: 'lc-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    ReactiveFormsModule,
    Password,
    Message,
    NgIf,
    Button,
    TranslocoDirective,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
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
        .subscribe({
          next: () => {
            this.loading = false;
            this.store.dispatch(toastNotification('CHANGE_PASSWORD_SUCCESS'));
            this.router.navigate(['']);
          },
          error: () => {
            this.loading = false;
          },
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
