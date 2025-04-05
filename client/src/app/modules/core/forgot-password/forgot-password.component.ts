import { Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { AppState } from '../../../ngrx/reducers';
import { LoadingState } from '../../../enums/loading-state';
import { selectForgotPasswordLoadingState } from '../../../ngrx/selectors/auth.selectors';
import { forgotPassword } from '../../../ngrx/actions/auth.actions';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Title } from '@angular/platform-browser';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { SharedModule } from '../../shared/shared.module';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { AsyncPipe } from '@angular/common';

/**
 * A component that shows a form for requesting a reset password link per mail.
 */
@Component({
  selector: 'lc-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    SharedModule,
    InputText,
    Button,
    AsyncPipe,
  ],
})
export class ForgotPasswordComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective) formDirective: FormDirective;

  public forgotPasswordForm: FormGroup;
  public loadingState$: Observable<LoadingState>;
  public loadingStates = LoadingState;

  constructor(
    private title: Title,
    private store: Store<AppState>,
    private translocoService: TranslocoService,
    private fb: FormBuilder,
  ) {}

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('forgotPasswordBrowserTitle'))} - ${instanceName}`,
      );
    });
    this.buildForm();
    this.loadingState$ = this.store.pipe(
      select(selectForgotPasswordLoadingState),
    );
  }

  /**
   * Requests a reset password mail.
   */
  public requestResetPasswordMail() {
    if (this.forgotPasswordForm.valid) {
      this.store.dispatch(
        forgotPassword({
          email: (
            this.forgotPasswordForm.get('email').value as string
          ).toLowerCase(),
        }),
      );
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Builds the reset password form.
   */
  private buildForm() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required]],
    });
  }
}
