import {
  Component,
  HostBinding,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { Router, RouterLink } from '@angular/router';
import { FormDirective } from '../../shared/forms/form.directive';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { firstValueFrom } from 'rxjs';
import { AppState } from '../../../ngrx/reducers';
import { User } from '../../../models/user';
import { loginSuccess } from '../../../ngrx/actions/auth.actions';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { PasskeyService } from '../../../services/crud/passkey.service';
import { UsersService } from '../../../services/crud/users.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Title } from '@angular/platform-browser';
import { emailRegex } from '../../../utility/regex/email-regex';
import { UserValidatorsService } from '../../../services/core/user-validators.service';
import { MessageModule } from 'primeng/message';
import { emailsValidator } from '../../../utility/validators/emails.validator';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import {
  createPasskey,
  isPasskeyCancellation,
  isPasskeySupported,
} from '../../../utility/webauthn';

@Component({
  selector: 'lc-register',
  imports: [
    ButtonModule,
    DividerModule,
    InputTextModule,
    PasswordModule,
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    RouterLink,
    MessageModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective) formDirective: FormDirective;

  public registrationForm: FormGroup;
  public loadingStates = LoadingState;
  public loadingState: LoadingState = LoadingState.DEFAULT;
  public registerPressed = false;
  public passkeySupported = isPasskeySupported();
  public passkeyLoading = false;

  private router = inject(Router);
  private usersService = inject(UsersService);
  private passkeys = inject(PasskeyService);
  private store = inject<Store<AppState>>(Store);
  private title = inject(Title);
  private userValidators = inject(UserValidatorsService);
  private translocoService = inject(TranslocoService);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.buildForm();
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('registerFormTabTitle'))} - ${instanceName}`,
      );
    });
  }

  public register() {
    this.registerPressed = true;
    if (this.registrationForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const user = new User();
      user.firstname = this.registrationForm.get('firstname').value;
      user.lastname = this.registrationForm.get('lastname').value;
      user.email = (
        this.registrationForm.get('emails.email').value as string
      ).toLowerCase();
      this.usersService.registerUser(user).subscribe(() => {
        this.store.dispatch(toastNotification('USER_REGISTERED'));
        this.router.navigate(['/register-check-mailbox']);
        this.loadingState = LoadingState.DEFAULT;
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Creates an account that can sign in with the new passkey and no password.
   */
  public async registerWithPasskey() {
    this.registerPressed = true;
    if (!this.registrationForm.valid) {
      this.formDirective.markAsTouched();
      return;
    }
    this.passkeyLoading = true;
    try {
      const options = await firstValueFrom(
        this.passkeys.signupOptions({
          firstname: this.registrationForm.get('firstname').value,
          lastname: this.registrationForm.get('lastname').value,
          email: (
            this.registrationForm.get('emails.email').value as string
          ).toLowerCase(),
        }),
      );
      const credential = await createPasskey(options);
      const loginResponse = await firstValueFrom(
        this.passkeys.signupVerify(
          credential,
          this.translocoService.translate(
            marker('accountPasskeys.defaultName'),
          ),
        ),
      );
      this.store.dispatch(loginSuccess({ loginResponse }));
    } catch (error) {
      if (!isPasskeyCancellation(error)) {
        this.store.dispatch(toastNotification('PASSKEY_ERROR'));
      }
    } finally {
      this.passkeyLoading = false;
    }
  }

  private buildForm() {
    this.registrationForm = this.fb.group({
      firstname: [null, [Validators.required, Validators.maxLength(120)]],
      lastname: [null, [Validators.required, Validators.maxLength(120)]],
      emails: this.fb.group(
        {
          email: [
            null,
            {
              validators: [
                Validators.required,
                Validators.pattern(emailRegex),
                Validators.maxLength(120),
              ],
              asyncValidators: [this.userValidators.emailValidator([])],
              updateOn: 'blur',
            },
          ],
          emailConfirm: [
            null,
            {
              validators: [
                Validators.required,
                Validators.pattern(emailRegex),
                Validators.maxLength(120),
              ],
              asyncValidators: [this.userValidators.emailValidator([])],
              updateOn: 'blur',
            },
          ],
        },
        {
          validators: emailsValidator(),
        },
      ),
    });
  }

  public emailsDontMatch(): boolean {
    if (
      this.registrationForm.get('emails.email').pristine ||
      this.registrationForm.get('emails.emailConfirm').pristine
    ) {
      return false;
    }
    return (
      this.registrationForm.get('emails').errors &&
      this.registrationForm.get('emails').errors['emailsMatch']
    );
  }
}
