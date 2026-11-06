import {
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import {
  clearTwoFactorChallenge,
  loginSuccess,
  updateTwoFactorChallenge,
} from '../../../ngrx/actions/auth.actions';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { AppState } from '../../../ngrx/reducers';
import { selectTwoFactorChallenge } from '../../../ngrx/selectors/auth.selectors';
import { TwoFactorChallenge } from '../../../models/two-factor-challenge';
import { AuthCrudService } from '../../../services/crud/auth-crud.service';
import { FormDirective } from '../../shared/forms/form.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

@Component({
  selector: 'lc-two-factor-prompt',
  templateUrl: './two-factor-prompt.component.html',
  styleUrl: './two-factor-prompt.component.scss',
  imports: [
    TranslocoDirective,
    TranslocoPipe,
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    InputText,
    Button,
  ],
})
export class TwoFactorPromptComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public challenge: TwoFactorChallenge | null = null;
  public submitting = false;
  public sending = false;

  private fb = inject(FormBuilder);
  private store = inject<Store<AppState>>(Store);
  private auth = inject(AuthCrudService);
  private destroyRef = inject(DestroyRef);

  public form: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  ngOnInit(): void {
    this.store
      .select(selectTwoFactorChallenge)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((challenge) => {
        this.challenge = challenge;
      });
  }

  public descriptionKey(): string {
    if (this.challenge?.totpEnabled && this.challenge.emailTwoFactorEnabled) {
      return 'eitherDescription';
    }
    if (this.challenge?.emailTwoFactorEnabled) {
      return 'emailDescription';
    }
    return 'authenticatorDescription';
  }

  public submit(): void {
    if (!this.challenge || this.form.invalid) {
      this.formDirective.markAsTouched();
      return;
    }
    this.submitting = true;
    const token = this.challenge.challengeToken;
    this.auth.verifyTwoFactor(token, this.form.value.code).subscribe({
      next: (loginResponse) => {
        this.store.dispatch(loginSuccess({ loginResponse }));
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        if (error.error?.message === 'TWO_FACTOR_CHALLENGE_INVALID') {
          this.store.dispatch(clearTwoFactorChallenge());
        }
      },
    });
  }

  public sendEmail(): void {
    if (!this.challenge) {
      return;
    }
    this.sending = true;
    const challenge = this.challenge;
    this.auth.sendTwoFactorEmail(challenge.challengeToken).subscribe({
      next: () => {
        this.sending = false;
        this.store.dispatch(toastNotification('TWO_FACTOR_EMAIL_SENT'));
        this.store.dispatch(
          updateTwoFactorChallenge({
            challenge: { ...challenge, emailSent: true },
          }),
        );
      },
      error: () => {
        this.sending = false;
      },
    });
  }

  public back(): void {
    this.store.dispatch(clearTwoFactorChallenge());
  }
}
