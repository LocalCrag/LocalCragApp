import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {AppState} from '../ngrx/reducers';
import {selectIsLoggedIn} from '../ngrx/selectors/auth.selectors';

/**
 * Guard for checking if a user is logged in.
 */
@Injectable({
  providedIn: 'root'
})
export class IsLoggedInGuard implements CanActivate {

  constructor(private store: Store<AppState>,
              private router: Router) {
  }

  /**
   * Lets the router activate the route if the user is logged in.
   * Else, he is rerouted to the login page.
   *
   * @return Observable that resolves to true if the user can activate the route.
   */
  canActivate(): Observable<boolean> {
    return this.store.pipe(
      select(selectIsLoggedIn),
      map(isLoggedInValue => {
        if (isLoggedInValue) {
          return true;
        }
        this.router.navigate(['login']);
        return false;
      })
    );
  }
}
