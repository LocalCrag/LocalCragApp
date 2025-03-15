import { Component, HostBinding, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Router, RouterLink } from '@angular/router';
import { selectIsLoggedIn } from '../../../ngrx/selectors/auth.selectors';
import { take } from 'rxjs/operators';
import { logout } from 'src/app/ngrx/actions/auth.actions';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { TranslocoDirective } from '@jsverse/transloco';

/**
 * A component that acts differently depending on if the user is currently logged in or not:
 *  - Logged-in users will be asked to log out if they want to activate an account
 *  - Non-logged-in users will directly be redirected to the login screen
 */
@Component({
  selector: 'lc-activate-account',
  imports: [
    ButtonModule,
    InputTextModule,
    ReactiveFormsModule,
    SharedModule,
    TranslocoDirective,
    RouterLink,
  ],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.scss',
})
export class ActivateAccountComponent implements OnInit {
  @HostBinding('class.auth-view') authView: boolean = true;

  constructor(
    private store: Store,
    private router: Router,
  ) {}

  /**
   * Redirects the user to the login screen if he is not logged in.
   */
  ngOnInit(): void {
    this.store
      .pipe(select(selectIsLoggedIn), take(1))
      .subscribe((isLoggedIn) => {
        if (!isLoggedIn) {
          this.router.navigate(['/', 'login']);
        }
      });
  }

  /**
   * Logs out the current user.
   */
  logout() {
    this.store.dispatch(logout({ isAutoLogout: false, silent: false }));
  }
}
