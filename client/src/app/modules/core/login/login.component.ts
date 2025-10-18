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
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

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
    InputText,
    Password,
    Button,
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

  private store = inject<Store<AppState>>(Store);
  private fb = inject(FormBuilder);

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
