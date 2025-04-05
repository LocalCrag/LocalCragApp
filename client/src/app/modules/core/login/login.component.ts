import { Component, HostBinding, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { login } from 'src/app/ngrx/actions/auth.actions';
import { AppState } from '../../../ngrx/reducers';
import { LoadingState } from '../../../enums/loading-state';
import { Observable } from 'rxjs';
import { selectLoginLoadingState } from '../../../ngrx/selectors/auth.selectors';
import { FormDirective } from '../../shared/forms/form.directive';
import { TranslocoDirective } from '@jsverse/transloco';
import { SharedModule } from '../../shared/shared.module';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';

/**
 * Component that shows a login form.
 */
@Component({
  selector: 'lc-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    SharedModule,
    InputText,
    Password,
    Button,
    RouterLink,
    AsyncPipe,
  ],
})
export class LoginComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  @ViewChild(FormDirective) formDirective: FormDirective;

  public loginForm: FormGroup;
  public loadingStates = LoadingState;
  public loadingState$: Observable<LoadingState>;

  constructor(
    private store: Store<AppState>,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.loadingState$ = this.store.pipe(select(selectLoginLoadingState));
    this.buildForm();
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
   * Builds the login form.
   */
  private buildForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }
}
