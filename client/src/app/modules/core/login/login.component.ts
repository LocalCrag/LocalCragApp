import {
  Component,
  HostBinding,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { login } from 'src/app/ngrx/actions/auth.actions';
import { AppState } from '../../../ngrx/reducers';
import { LoadingState } from '../../../enums/loading-state';
import { Observable } from 'rxjs';
import { selectLoginLoadingState } from '../../../ngrx/selectors/auth.selectors';
import { FormDirective } from '../../shared/forms/form.directive';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import {
  API_HOST_PREFERENCE_KEY,
  isAllowedApiHostUrl,
  normalizeApiHostUrl,
  RUNTIME_API_HOST,
} from '../../../services/core/runtime-api-host';

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
    FormsModule,
    InputText,
    Password,
    Button,
    MessageModule,
    RouterLink,
    AsyncPipe,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
})
export class LoginComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective) formDirective: FormDirective;

  public loginForm: FormGroup;
  public loadingStates = LoadingState;
  public loadingState$: Observable<LoadingState>;
  /** Temporary native-only debug control (D-04); Phase 16 replaces with picker. */
  public readonly isNativePlatform = Capacitor.isNativePlatform();
  public debugApiHost = '';
  public debugApiHostError: string | null = null;
  public debugApiHostSaving = false;

  private store = inject<Store<AppState>>(Store);
  private fb = inject(FormBuilder);
  private runtimeApiHost = inject(RUNTIME_API_HOST);

  ngOnInit(): void {
    this.loadingState$ = this.store.pipe(select(selectLoginLoadingState));
    this.buildForm();
    this.debugApiHost = this.runtimeApiHost;
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
   * Persist debug API base URL and reload so main.ts re-resolves (D-04, D-10).
   */
  public async saveDebugApiHost(): Promise<void> {
    const normalized = normalizeApiHostUrl(this.debugApiHost);
    if (!isAllowedApiHostUrl(normalized)) {
      this.debugApiHostError = 'invalid';
      return;
    }
    this.debugApiHostError = null;
    this.debugApiHostSaving = true;
    try {
      await Preferences.set({
        key: API_HOST_PREFERENCE_KEY,
        value: normalized,
      });
      window.location.reload();
    } catch {
      this.debugApiHostError = 'saveFailed';
      this.debugApiHostSaving = false;
    }
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
