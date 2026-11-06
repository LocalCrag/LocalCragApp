import {
  AfterViewInit,
  Component,
  HostBinding,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  DestroyRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { login, loginSuccess } from 'src/app/ngrx/actions/auth.actions';
import { AppState } from '../../../ngrx/reducers';
import { LoadingState } from '../../../enums/loading-state';
import { Observable, firstValueFrom } from 'rxjs';
import {
  selectLoginLoadingState,
  selectTwoFactorChallenge,
} from '../../../ngrx/selectors/auth.selectors';
import { TwoFactorChallenge } from '../../../models/two-factor-challenge';
import { TwoFactorPromptComponent } from '../two-factor-prompt/two-factor-prompt.component';
import { FormDirective } from '../../shared/forms/form.directive';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { PasskeyService } from '../../../services/crud/passkey.service';
import {
  getPasskey,
  isConditionalMediationAvailable,
  isPasskeyCancellation,
  isPasskeySupported,
} from '../../../utility/webauthn';

/**
 * Component that shows a login form.
 */
@Component({
  selector: 'lc-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    TranslocoDirective,
    TranslocoPipe,
    ReactiveFormsModule,
    InputText,
    Password,
    Button,
    RouterLink,
    AsyncPipe,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    DividerModule,
    TwoFactorPromptComponent,
  ],
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective) formDirective: FormDirective;

  public loginForm: FormGroup;
  public loadingStates = LoadingState;
  public loadingState$: Observable<LoadingState>;
  public passkeySupported = isPasskeySupported();
  public passkeyLoading = false;
  public challenge: TwoFactorChallenge | null = null;

  private store = inject<Store<AppState>>(Store);
  private fb = inject(FormBuilder);
  private passkeys = inject(PasskeyService);
  private destroyRef = inject(DestroyRef);
  private conditionalRequest: AbortController | null = null;
  private passkeyRequest = 0;

  ngOnInit(): void {
    this.loadingState$ = this.store.pipe(select(selectLoginLoadingState));
    this.store
      .pipe(
        select(selectTwoFactorChallenge),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((challenge) => {
        this.challenge = challenge;
        if (challenge) {
          this.stopConditionalPasskey();
        }
      });
    this.buildForm();
  }

  ngAfterViewInit(): void {
    void this.startConditionalPasskey();
  }

  ngOnDestroy(): void {
    this.passkeyRequest += 1;
    this.stopConditionalPasskey();
  }

  /**
   * Logs in a user.
   */
  public login() {
    if (this.loginForm.valid) {
      this.store.dispatch(
        login({
          email: (this.loginForm.get('email').value as string).toLowerCase(),
          password: this.loginForm.get('password').value,
        }),
      );
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Signs in with a discoverable passkey already registered on the account.
   */
  public async loginWithPasskey() {
    const requestId = ++this.passkeyRequest;
    this.stopConditionalPasskey();
    this.passkeyLoading = true;
    try {
      const options = await firstValueFrom(this.passkeys.loginOptions());
      const credential = await getPasskey(options);
      const loginResponse = await firstValueFrom(
        this.passkeys.loginVerify(credential),
      );
      if (requestId !== this.passkeyRequest) {
        return;
      }
      this.store.dispatch(loginSuccess({ loginResponse }));
    } catch (error) {
      if (requestId === this.passkeyRequest && !isPasskeyCancellation(error)) {
        this.store.dispatch(toastNotification('PASSKEY_LOGIN_ERROR'));
      }
    } finally {
      if (requestId === this.passkeyRequest) {
        this.passkeyLoading = false;
      }
    }
  }

  /**
   * Offers a saved passkey in the email field when the browser supports it.
   * Cancelling that prompt is not an error.
   */
  private async startConditionalPasskey() {
    const requestId = ++this.passkeyRequest;
    if (!(await isConditionalMediationAvailable())) {
      return;
    }
    if (requestId !== this.passkeyRequest) {
      return;
    }
    const abort = new AbortController();
    this.conditionalRequest = abort;
    try {
      const options = await firstValueFrom(this.passkeys.loginOptions());
      if (requestId !== this.passkeyRequest || abort.signal.aborted) {
        return;
      }
      const credential = await getPasskey(options, 'conditional', abort.signal);
      const loginResponse = await firstValueFrom(
        this.passkeys.loginVerify(credential),
      );
      if (requestId !== this.passkeyRequest) {
        return;
      }
      this.store.dispatch(loginSuccess({ loginResponse }));
    } catch (error) {
      if (requestId !== this.passkeyRequest || isPasskeyCancellation(error)) {
        return;
      }
      this.store.dispatch(toastNotification('PASSKEY_LOGIN_ERROR'));
    }
  }

  private stopConditionalPasskey() {
    this.conditionalRequest?.abort();
    this.conditionalRequest = null;
  }

  /**
   * Builds the login form.
   */
  private buildForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.maxLength(120)]],
      password: ['', [Validators.required, Validators.maxLength(120)]],
    });
  }
}
