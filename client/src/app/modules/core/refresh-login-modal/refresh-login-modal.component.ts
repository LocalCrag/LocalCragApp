import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import { Observable } from 'rxjs';
import { LoadingState } from '../../../enums/loading-state';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { select, Store } from '@ngrx/store';
import { AppState } from '../../../ngrx/reducers';
import {
  selectCurrentUser,
  selectRefreshLoginLoadingState,
  selectRefreshLoginModalLogoutLoadingState,
  selectRefreshLoginModalOpen,
} from '../../../ngrx/selectors/auth.selectors';
import { filter } from 'rxjs/operators';
import { login, logout } from '../../../ngrx/actions/auth.actions';
import { TranslocoDirective } from '@jsverse/transloco';
import { Dialog } from 'primeng/dialog';
import { AsyncPipe, NgIf } from '@angular/common';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { Password } from 'primeng/password';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { Button } from 'primeng/button';

/**
 * A modal for refreshing the current refresh token by performing a new login.
 */
@Component({
  selector: 'lc-refresh-login-modal',
  templateUrl: './refresh-login-modal.component.html',
  styleUrls: ['./refresh-login-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    TranslocoDirective,
    Dialog,
    NgIf,
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    Password,
    FormControlDirective,
    IfErrorDirective,
    Button,
    AsyncPipe,
  ],
})
export class RefreshLoginModalComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  @Output() saved: EventEmitter<null> = new EventEmitter<null>();

  public isOpen = false;
  public isLoading$: Observable<LoadingState>;
  public logoutIsLoading$: Observable<LoadingState>;
  public refreshLoginForm: FormGroup;
  public loadingStates = LoadingState;

  private email: string;
  private fb = inject(FormBuilder);
  private store = inject<Store<AppState>>(Store);

  /**
   * Loads the logged-in user to fetch the email for the re-login.
   */
  ngOnInit(): void {
    this.store
      .pipe(
        select(selectCurrentUser),
        filter((user) => user !== null),
      )
      .subscribe((user) => {
        this.email = user.email;
      });
    this.store.pipe(select(selectRefreshLoginModalOpen)).subscribe((isOpen) => {
      if (isOpen) {
        this.buildForm();
      }
      this.isOpen = isOpen;
    });
    this.isLoading$ = this.store.pipe(select(selectRefreshLoginLoadingState));
    this.logoutIsLoading$ = this.store.pipe(
      select(selectRefreshLoginModalLogoutLoadingState),
    );
  }

  /**
   * Builds the refresh login form.
   */
  buildForm() {
    this.refreshLoginForm = this.fb.group({
      password: ['', [Validators.required]],
    });
  }

  /**
   * Refreshes the login.
   */
  refreshLogin() {
    if (this.refreshLoginForm.valid) {
      this.store.dispatch(
        login({
          password: this.refreshLoginForm.get('password').value,
          email: this.email,
        }),
      );
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Logs out the user.
   */
  logout() {
    this.store.dispatch(logout({ isAutoLogout: false, silent: false }));
  }
}
