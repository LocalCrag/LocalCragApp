import {
  Component,
  HostBinding,
  OnInit,
  DestroyRef,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { AppState } from '../../../ngrx/reducers';
import { User } from '../../../models/user';
import { AuthCrudService } from '../../../services/crud/auth-crud.service';
import { updateAccountSettings } from '../../../ngrx/actions/auth.actions';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { selectCurrentUser } from '../../../ngrx/selectors/auth.selectors';
import { passwordsValidator } from '../../../utility/validators/passwords.validator';
import {
  PasswordScore,
  configurePasswordStrength,
  scorePassword,
} from '../../../utility/password-strength';
import { FormDirective } from '../../shared/forms/form.directive';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { Password } from 'primeng/password';
import { Message } from 'primeng/message';

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
    Button,
    TranslocoDirective,
    TranslocoPipe,
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
  public hasPassword = true;
  public passwordScore: PasswordScore | null = null;

  private authCrudService = inject(AuthCrudService);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private store = inject<Store<AppState>>(Store);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private userInputs: string[] = [];

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
    this.changePasswordForm
      .get('newPasswords.password')
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshStrength());
    void this.useStrengthLanguage(this.translocoService.getActiveLang());
    this.translocoService.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((language) => {
        void this.useStrengthLanguage(language);
      });
    this.store
      .select(selectCurrentUser)
      .pipe(take(1))
      .subscribe((user) => {
        this.hasPassword = user?.hasPassword !== false;
        this.userInputs = [user?.firstname, user?.lastname, user?.email].filter(
          (value): value is string => !!value,
        );
        this.refreshStrength();
        if (!this.hasPassword) {
          const oldPassword = this.changePasswordForm.get('oldPassword');
          oldPassword.clearValidators();
          oldPassword.updateValueAndValidity();
        }
      });
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
          this.hasPassword
            ? this.changePasswordForm.get('oldPassword').value
            : null,
          this.changePasswordForm.get('newPasswords.password').value,
        )
        .subscribe({
          next: () => {
            this.loading = false;
            if (!this.hasPassword) {
              this.store
                .select(selectCurrentUser)
                .pipe(take(1))
                .subscribe((user) => {
                  if (!user) {
                    return;
                  }
                  const updated = Object.assign(new User(), user);
                  updated.hasPassword = true;
                  this.store.dispatch(updateAccountSettings({ user: updated }));
                });
            }
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
   * Translation key for the current zxcvbn score.
   */
  public strengthKey(): string {
    return `strength${this.passwordScore?.score ?? 0}`;
  }

  private async useStrengthLanguage(language: string): Promise<void> {
    await configurePasswordStrength(language);
    this.refreshStrength();
  }

  private refreshStrength(): void {
    const value =
      this.changePasswordForm?.get('newPasswords.password')?.value ?? '';
    this.passwordScore = scorePassword(value, this.userInputs);
  }

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
          password: [
            '',
            [
              Validators.required,
              Validators.minLength(8),
              Validators.maxLength(120),
            ],
          ],
          passwordConfirm: [
            '',
            [
              Validators.required,
              Validators.minLength(8),
              Validators.maxLength(120),
            ],
          ],
        },
        {
          validators: passwordsValidator(),
        },
      ),
      oldPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(120),
        ],
      ],
    });
  }
}
